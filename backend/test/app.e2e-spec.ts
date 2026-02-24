/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppExceptionFilter } from '../src/common/filters/app-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { SnakeCaseResponseInterceptor } from '../src/common/interceptors/snake-case-response.interceptor';
import { SnakeToCamelBodyPipe } from '../src/common/pipes/snake-to-camel-body.pipe';
import { MailService } from '../src/modules/mail/mail.service';
import { ReceiptLlmService } from '../src/modules/receipt-ocr/receipt-llm.service';

describe('App E2E (Splibilo full flow)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let sendGroupInviteMailMock: jest.Mock;
  let sendSettlementReceivedMailMock: jest.Mock;
  let parseRawTextMock: jest.Mock;

  const createTestImageBuffer = () =>
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );

  beforeAll(async () => {
    jest.setTimeout(60000);

    // Create Jest mocks that we can assert on later
    sendGroupInviteMailMock = jest.fn().mockResolvedValue(undefined);
    sendSettlementReceivedMailMock = jest.fn().mockResolvedValue(undefined);
    parseRawTextMock = jest.fn().mockResolvedValue({
      items: [],
      subtotal: null,
      tax: null,
      grand_total: null,
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue({
        sendGroupInviteMail: sendGroupInviteMailMock,
        sendSettlementReceivedMail: sendSettlementReceivedMailMock,
      })
      .overrideProvider(ReceiptLlmService)
      .useValue({
        parseRawText: parseRawTextMock,
      })
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();

    app.useGlobalFilters(new AppExceptionFilter());
    app.useGlobalInterceptors(
      new ResponseInterceptor(),
      new SnakeCaseResponseInterceptor(),
    );
    app.useGlobalPipes(
      new SnakeToCamelBodyPipe(),
      new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    (app as NestExpressApplication).useStaticAssets(
      join(__dirname, '..', 'uploads'),
      {
        prefix: '/uploads/',
      },
    );

    prisma = app.get<PrismaService>(PrismaService);

    // Clean DB at start
    await prisma.settlement.deleteMany();
    await prisma.expenseShare.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.invite.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    await app.init();
  }, 60000);

  afterAll(async () => {
    // Clean DB at end
    await prisma.settlement.deleteMany();
    await prisma.expenseShare.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.invite.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    await prisma.$disconnect();
    await app.close();
  });

  describe('Happy path: two users, one group, expenses and settlement', () => {
    let userToken: string;
    let userRefreshToken: string;
    let userId: string;

    let memberToken: string;
    let memberId: string;

    let adminToken: string;
    let adminId: string;

    let groupId: string;
    let groupInviteCode: string;

    let expenseId: string;
    let settlementId: string;

    let avatarPath: string;

    const userEmail = `user_${Date.now()}@example.com`;
    const memberEmail = `member_${Date.now()}@example.com`;
    const adminEmail = `admin_${Date.now()}@example.com`;

    // ===== Auth =====

    it('registers a normal user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: userEmail,
          name: 'Normal User',
          password: 'password123',
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('access_token');
      expect(res.body.data).toHaveProperty('refresh_token');

      userToken = res.body.data.access_token as string;
      userRefreshToken = res.body.data.refresh_token as string;
    });

    it('rejects duplicate registration for same email (Prisma P2002)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: userEmail,
          name: 'Duplicate User',
          password: 'password123',
        })
        .expect(409);
    });

    it('registers a second member user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: memberEmail,
          name: 'Member User',
          password: 'password123',
        })
        .expect(201);

      memberToken = res.body.data.access_token as string;
    });

    it('registers an admin user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: adminEmail,
          name: 'Admin User',
          password: 'password123',
          role: 'ADMIN',
        })
        .expect(201);

      adminToken = res.body.data.access_token as string;
    });

    it('logs in the normal user and retrieves profile', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userEmail,
          password: 'password123',
        })
        .expect(200);

      userToken = loginRes.body.data.access_token;
      userRefreshToken = loginRes.body.data.refresh_token;

      const meRes = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(meRes.body.data.email).toBe(userEmail);
      userId = meRes.body.data.id;
    });

    it('logs in member user and fetches profile', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: memberEmail,
          password: 'password123',
        })
        .expect(200);

      memberToken = loginRes.body.data.access_token;

      const meRes = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      memberId = meRes.body.data.id;
    });

    it('logs in admin and saves id', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminEmail,
          password: 'password123',
        })
        .expect(200);

      adminToken = loginRes.body.data.access_token;

      const meRes = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      adminId = meRes.body.data.id;
      expect(meRes.body.data.role).toBe('ADMIN');
    });

    it('refreshes access token and logs out', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: memberEmail,
          password: 'password123',
        })
        .expect(200);

      const memberAccessToken = loginRes.body.data.access_token as string;
      const memberRefreshToken = loginRes.body.data.refresh_token as string;

      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: memberRefreshToken,
        })
        .expect(200);

      expect(refreshRes.body.data).toHaveProperty('access_token');
      const refreshedMemberAccessToken = refreshRes.body.data
        .access_token as string;

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${memberAccessToken}`)
        .send({
          refreshToken: memberRefreshToken,
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: memberRefreshToken,
        })
        .expect(403);

      void refreshedMemberAccessToken;
    });

    // ===== Upload + /me =====

    it('uploads an avatar image and updates profile', async () => {
      const uploadRes = await request(app.getHttpServer())
        .post('/upload/avatar')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', createTestImageBuffer(), 'avatar.png')
        .expect(201);

      expect(uploadRes.body.data).toHaveProperty('path');
      expect(uploadRes.body.data).toHaveProperty('file_url');
      avatarPath = uploadRes.body.data.path;

      const patchRes = await request(app.getHttpServer())
        .patch('/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated User Name',
          avatar_url: avatarPath,
          email_on_settlement_received: true,
        })
        .expect(200);

      expect(patchRes.body.data.name).toBe('Updated User Name');
      expect(patchRes.body.data.avatar_url).toBeDefined();
    });

    it('rejects non image avatar upload and oversized file', async () => {
      const textBuffer = Buffer.from('this is not an image');

      await request(app.getHttpServer())
        .post('/upload/avatar')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', textBuffer, 'note.txt')
        .expect(400);

      const bigBuffer = Buffer.alloc(6 * 1024 * 1024);
      await request(app.getHttpServer())
        .post('/upload/avatar')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', bigBuffer, 'large.png')
        .expect(413);
    });

    it('rejects invalid upload kind before processing file', async () => {
      await request(app.getHttpServer())
        .post('/upload/invalid-kind')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', createTestImageBuffer(), 'avatar.png')
        .expect(400);
    });

    it('rejects upload when no file is sent', async () => {
      await request(app.getHttpServer())
        .post('/upload/avatar')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });

    it('uploads receipt, proof, and icon kinds and builds correct URLs', async () => {
      const kinds = ['receipt', 'proof', 'icon'] as const;

      for (const kind of kinds) {
        const res = await request(app.getHttpServer())
          .post(`/upload/${kind}`)
          .set('Authorization', `Bearer ${userToken}`)
          .attach('file', createTestImageBuffer(), `${kind}.png`)
          .expect(201);

        expect(res.body.data).toBeDefined();
        expect(res.body.data.kind).toBe(kind);
        expect(typeof res.body.data.file_url).toBe('string');
        expect(res.body.data.file_url).toContain('/uploads/');

        if (kind === 'receipt') {
          expect(res.body.data.path).toContain('receipts/');
        } else if (kind === 'proof') {
          expect(res.body.data.path).toContain('proofs/');
        } else if (kind === 'icon') {
          expect(res.body.data.path).toContain('icons/');
        }
      }
    });

    // ===== Group + Invites =====

    it('creates a group', async () => {
      const res = await request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Trip Bali',
          description: 'Holiday group',
          category: 'Travel',
        })
        .expect(201);

      expect(res.body.data.name).toBe('Trip Bali');
      groupId = res.body.data.id;
    });

    it('lists my groups and gets group detail', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/groups')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ category: 'Travel' })
        .expect(200);

      expect(Array.isArray(listRes.body.data)).toBe(true);
      expect(listRes.body.data[0].id).toBe(groupId);

      const detailRes = await request(app.getHttpServer())
        .get(`/groups/${groupId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(detailRes.body.data.id).toBe(groupId);
    });

    it('lists my groups with disable pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/groups')
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          disable_pagination: true,
          search: 'Trip',
          category: 'Travel',
        })
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeUndefined();
    });

    it('updates group settings', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/groups/${groupId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Trip Bali Updated',
          members_can_edit_all_expenses: true,
          members_can_delete_expenses: true,
        })
        .expect(200);

      expect(res.body.data.name).toBe('Trip Bali Updated');
      expect(res.body.data.members_can_edit_all_expenses).toBe(true);
      expect(res.body.data.members_can_delete_expenses).toBe(true);
    });

    it('allows no-op group update (no fields) and returns group unchanged', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/groups/${groupId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(200);

      expect(res.body.data.id).toBe(groupId);
    });

    it('prevents non owners from changing group lock and permissions', async () => {
      await request(app.getHttpServer())
        .patch(`/groups/${groupId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          is_locked: true,
          members_can_edit_all_expenses: true,
          members_can_delete_expenses: true,
        })
        .expect(403);
    });

    it('creates an email invite and member accepts via code', async () => {
      const inviteRes = await request(app.getHttpServer())
        .post(`/groups/${groupId}/invites`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'invited-friend@example.com',
        })
        .expect(201);

      expect(inviteRes.body.data).toHaveProperty('code');
      groupInviteCode = inviteRes.body.data.code;

      const acceptRes = await request(app.getHttpServer())
        .post('/invites/accept')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          code: groupInviteCode,
        })
        .expect(200);

      expect(acceptRes.body.data).toBeDefined();

      const listRes = await request(app.getHttpServer())
        .get('/groups')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(listRes.body.data.length).toBeGreaterThan(0);

      // Assert that mocked MailService was used for invite
      expect(sendGroupInviteMailMock).toHaveBeenCalled();
    });

    it('rejects creating invite for email that already belongs to a group member', async () => {
      await request(app.getHttpServer())
        .post(`/groups/${groupId}/invites`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: memberEmail,
        })
        .expect(400);
    });

    it('rejects duplicate active invite for same email', async () => {
      const dupEmail = `dup_${Date.now()}@example.com`;

      await request(app.getHttpServer())
        .post(`/groups/${groupId}/invites`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: dupEmail,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/groups/${groupId}/invites`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: dupEmail,
        })
        .expect(400);
    });

    it('marks invite as accepted when user already a member', async () => {
      const invite = await prisma.invite.create({
        data: {
          email: userEmail,
          group_id: groupId,
          code: `ALREADY_${Date.now()}`,
          expired_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const res = await request(app.getHttpServer())
        .post('/invites/accept')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ code: invite.code })
        .expect(200);

      expect(res.body.data.group_id).toBe(groupId);
      expect(res.body.data.already_member).toBe(true);
    });

    it('returns 404 on invalid invite code', async () => {
      await request(app.getHttpServer())
        .post('/invites/accept')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ code: 'INVALID_CODE_123' })
        .expect(404);
    });

    it('prevents non-owners from creating group invites', async () => {
      await request(app.getHttpServer())
        .post(`/groups/${groupId}/invites`)
        .set('Authorization', `Bearer ${memberToken}`) // member is not owner
        .send({
          email: `non_owner_${Date.now()}@example.com`,
        })
        .expect(403);
    });

    it('rejects creating an invite when group is archived (group not joinable)', async () => {
      // Archive the group
      await request(app.getHttpServer())
        .patch(`/groups/${groupId}/archive`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Try to create invite while archived
      const res = await request(app.getHttpServer())
        .post(`/groups/${groupId}/invites`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: `archived_${Date.now()}@example.com`,
        })
        .expect(400);

      expect(res.body.message).toBe('Group is not joinable');

      // Unarchive so later tests run on a normal group again
      await request(app.getHttpServer())
        .patch(`/groups/${groupId}/unarchive`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });

    it('rejects accepting an invite that has already been accepted', async () => {
      const alreadyAcceptedInvite = await prisma.invite.create({
        data: {
          email: `accepted_${Date.now()}@example.com`,
          group_id: groupId,
          code: `ACCEPTED_${Date.now()}`,
          expired_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          accepted_at: new Date(), // already accepted
        },
      });

      const res = await request(app.getHttpServer())
        .post('/invites/accept')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ code: alreadyAcceptedInvite.code })
        .expect(400);

      expect(res.body.message).toBe('Invite has already been accepted');
    });

    it('rejects accepting an expired invite', async () => {
      const expiredInvite = await prisma.invite.create({
        data: {
          email: `expired_${Date.now()}@example.com`,
          group_id: groupId,
          code: `EXPIRED_${Date.now()}`,
          expired_at: new Date(Date.now() - 60 * 1000), // already in the past
        },
      });

      const res = await request(app.getHttpServer())
        .post('/invites/accept')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ code: expiredInvite.code })
        .expect(400);

      expect(res.body.message).toBe('Invite has expired');
    });

    it('lists group members', async () => {
      const res = await request(app.getHttpServer())
        .get(`/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(2);
    });

    it('prevents the only owner from leaving the group', async () => {
      await request(app.getHttpServer())
        .post(`/groups/${groupId}/leave`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });

    // ===== Expenses =====

    it('creates an expense with equal split', async () => {
      const res = await request(app.getHttpServer())
        .post(`/groups/${groupId}/expenses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'Lunch',
          amount: 100000,
          category: 'Food',
          date: new Date().toISOString(),
          paid_by_user_id: userId,
          receipt_url: 'https://example.com/receipts/lunch.png',
          shares: [
            { user_id: userId, amount: 50000 },
            { user_id: memberId, amount: 50000 },
          ],
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.amount).toBe(100000);
      expenseId = res.body.data.id;
    });

    it('rejects expense when paid_by user is not a group member', async () => {
      await request(app.getHttpServer())
        .post(`/groups/${groupId}/expenses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'Invalid payer',
          amount: 50000,
          category: 'Food',
          date: new Date().toISOString(),
          paid_by_user_id: adminId,
          shares: [
            { user_id: userId, amount: 25000 },
            { user_id: memberId, amount: 25000 },
          ],
        })
        .expect(400);
    });

    it('rejects expense where shares do not match amount', async () => {
      await request(app.getHttpServer())
        .post(`/groups/${groupId}/expenses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'Bad dinner',
          amount: 100000,
          category: 'Food',
          date: new Date().toISOString(),
          paid_by_user_id: userId,
          shares: [
            { user_id: userId, amount: 40000 },
            { user_id: memberId, amount: 40000 },
          ],
        })
        .expect(400);
    });

    it('lists expenses and returns detail', async () => {
      const listRes = await request(app.getHttpServer())
        .get(`/groups/${groupId}/expenses`)
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          page: 1,
          per_page: 10,
        })
        .expect(200);

      expect(listRes.body.data.length).toBe(1);
      expect(listRes.body.data[0].id).toBe(expenseId);

      const detailRes = await request(app.getHttpServer())
        .get(`/groups/${groupId}/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(detailRes.body.data.id).toBe(expenseId);
      expect(detailRes.body.data.expense_shares.length).toBe(2);
    });

    it('lists expenses with filters and disable pagination', async () => {
      const res = await request(app.getHttpServer())
        .get(`/groups/${groupId}/expenses`)
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          disable_pagination: true,
          search: 'Lunch',
          category: 'Food',
          min_amount: 50000,
          max_amount: 200000,
          paid_by_user_id: userId,
        })
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].id).toBe(expenseId);
      expect(res.body.meta).toBeUndefined();
    });

    it('rejects update when amount and shares mismatch (case 1)', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`/groups/${groupId}/expenses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'To update case1',
          amount: 100000,
          category: 'Food',
          date: new Date().toISOString(),
          paid_by_user_id: userId,
          shares: [
            { user_id: userId, amount: 50000 },
            { user_id: memberId, amount: 50000 },
          ],
        })
        .expect(201);

      const id = createRes.body.data.id as string;

      await request(app.getHttpServer())
        .patch(`/groups/${groupId}/expenses/${id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 200000,
          shares: [
            { user_id: userId, amount: 50000 },
            { user_id: memberId, amount: 50000 },
          ],
        })
        .expect(400);
    });

    it('rejects update when only shares mismatch existing amount (case 2)', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`/groups/${groupId}/expenses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'To update case2',
          amount: 100000,
          category: 'Food',
          date: new Date().toISOString(),
          paid_by_user_id: userId,
          shares: [
            { user_id: userId, amount: 50000 },
            { user_id: memberId, amount: 50000 },
          ],
        })
        .expect(201);

      const id = createRes.body.data.id as string;

      await request(app.getHttpServer())
        .patch(`/groups/${groupId}/expenses/${id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shares: [
            { user_id: userId, amount: 30000 },
            { user_id: memberId, amount: 30000 },
          ],
        })
        .expect(400);
    });

    it('rejects update when only amount mismatches existing shares (case 3)', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`/groups/${groupId}/expenses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'To update case3',
          amount: 100000,
          category: 'Food',
          date: new Date().toISOString(),
          paid_by_user_id: userId,
          shares: [
            { user_id: userId, amount: 50000 },
            { user_id: memberId, amount: 50000 },
          ],
        })
        .expect(201);

      const id = createRes.body.data.id as string;

      await request(app.getHttpServer())
        .patch(`/groups/${groupId}/expenses/${id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 200000,
        })
        .expect(400);
    });

    it('updates an expense and then deletes it', async () => {
      const patchRes = await request(app.getHttpServer())
        .patch(`/groups/${groupId}/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'Lunch updated',
          notes: 'Added dessert',
        })
        .expect(200);

      expect(patchRes.body.data.description).toBe('Lunch updated');

      await request(app.getHttpServer())
        .delete(`/groups/${groupId}/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/groups/${groupId}/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('creates another expense so balances and settlements have data', async () => {
      const res = await request(app.getHttpServer())
        .post(`/groups/${groupId}/expenses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'Dinner',
          amount: 150000,
          category: 'Food',
          date: new Date().toISOString(),
          paid_by_user_id: userId,
          shares: [
            { user_id: userId, amount: 50000 },
            { user_id: memberId, amount: 100000 },
          ],
        })
        .expect(201);

      expenseId = res.body.data.id;
    });

    // ===== Balances, Settlements, analytics =====

    it('gets group balances and analytics with explicit range', async () => {
      const balancesRes = await request(app.getHttpServer())
        .get(`/groups/${groupId}/balances`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(balancesRes.body.data).toBeDefined();

      const analyticsRes = await request(app.getHttpServer())
        .get(`/groups/${groupId}/analytics`)
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          from: '2025-01-01',
          to: '2030-01-01',
        })
        .expect(200);

      expect(analyticsRes.body.data).toHaveProperty('totals');
      expect(analyticsRes.body.data.totals).toHaveProperty(
        'group_total_expenses',
      );
      expect(analyticsRes.body.data).toHaveProperty('by_category');
      expect(analyticsRes.body.data.range.applied).toBe(true);
    });

    it('gets group analytics with default date range', async () => {
      const res = await request(app.getHttpServer())
        .get(`/groups/${groupId}/analytics`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.range.applied).toBe(false);
    });

    it('rejects analytics with invalid date range', async () => {
      await request(app.getHttpServer())
        .get(`/groups/${groupId}/analytics`)
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          from: '2030-01-02',
          to: '2030-01-01',
        })
        .expect(400);
    });

    it('member settles a valid part of the debt', async () => {
      const res = await request(app.getHttpServer())
        .post(`/groups/${groupId}/settlements`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          to_user_id: userId,
          amount: 50000,
          notes: 'First repayment',
          date: new Date().toISOString(),
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      settlementId = res.body.data.id;

      // Assert email notification mock is called
      expect(sendSettlementReceivedMailMock).toHaveBeenCalled();
    });

    it('rejects settlement that exceeds existing debt', async () => {
      await request(app.getHttpServer())
        .post(`/groups/${groupId}/settlements`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          to_user_id: userId,
          amount: 100000000,
          date: new Date().toISOString(),
        })
        .expect(400);
    });

    it('prevents self settlement for the same user', async () => {
      await request(app.getHttpServer())
        .post(`/groups/${groupId}/settlements`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          to_user_id: memberId,
          amount: 10000,
        })
        .expect(400);
    });

    it('lists settlements and returns detail', async () => {
      const listRes = await request(app.getHttpServer())
        .get(`/groups/${groupId}/settlements`)
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          member_id: memberId,
        })
        .expect(200);

      expect(listRes.body.data.length).toBe(1);
      expect(listRes.body.data[0].id).toBe(settlementId);

      const detailRes = await request(app.getHttpServer())
        .get(`/groups/${groupId}/settlements/${settlementId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(detailRes.body.data.id).toBe(settlementId);
    });

    it('lists settlements with disable pagination', async () => {
      const res = await request(app.getHttpServer())
        .get(`/groups/${groupId}/settlements`)
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          disable_pagination: true,
        })
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeUndefined();
    });

    // ===== User activity =====

    it('returns user activity for a date range', async () => {
      const res = await request(app.getHttpServer())
        .get('/user/activity')
        .set('Authorization', `Bearer ${memberToken}`)
        .query({
          from: '2025-01-01',
          to: '2030-01-01',
        })
        .expect(200);

      expect(res.body.data).toHaveProperty('period');
      expect(res.body.data).toHaveProperty('totals');
      expect(res.body.data.totals).toHaveProperty('my_total_expense_share');
    });

    it('returns user activity with default range', async () => {
      const res = await request(app.getHttpServer())
        .get('/user/activity')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(res.body.data.period).toBeDefined();
    });

    it('returns user activity with default period when no range is provided', async () => {
      const res = await request(app.getHttpServer())
        .get('/user/activity')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('period');
      expect(res.body.data.period).toHaveProperty('from');
      expect(res.body.data.period).toHaveProperty('to');
      expect(res.body.data.period.applied).toBe(false);
    });

    it('rejects user activity request when date range is invalid', async () => {
      const res = await request(app.getHttpServer())
        .get('/user/activity')
        .set('Authorization', `Bearer ${memberToken}`)
        .query({
          from: '2030-01-01',
          to: '2020-01-01',
        })
        .expect(400);

      expect(res.body).toHaveProperty('code', 400);
      expect(res.body).toHaveProperty('message');
    });

    // ===== Admin modules =====

    it('admin lists users and updates one user status', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ role: 'USER' })
        .expect(200);

      expect(Array.isArray(listRes.body.data)).toBe(true);

      const userDetailRes = await request(app.getHttpServer())
        .get(`/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(userDetailRes.body.data.id).toBe(userId);

      const patchRes = await request(app.getHttpServer())
        .patch(`/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'User Patched by Admin',
          is_suspended: false,
        })
        .expect(200);

      expect(patchRes.body.data.name).toBe('User Patched by Admin');
    });

    it('admin can filter users by suspension status and list without pagination', async () => {
      // Suspend the main user first so we have at least one suspended user
      await request(app.getHttpServer())
        .patch(`/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          is_suspended: true,
        })
        .expect(200);

      const suspendedRes = await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          disable_pagination: true,
          is_suspended: 'true',
          search: 'User',
        })
        .expect(200);

      expect(Array.isArray(suspendedRes.body.data)).toBe(true);
      if (suspendedRes.body.data.length > 0) {
        expect(
          suspendedRes.body.data.every((u: any) => u.is_suspended === true),
        ).toBe(true);
      }

      const activeRes = await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          disable_pagination: true,
          is_suspended: 'false',
        })
        .expect(200);

      expect(Array.isArray(activeRes.body.data)).toBe(true);
    });

    it('admin lists groups and expenses, then removes an expense receipt', async () => {
      const groupsRes = await request(app.getHttpServer())
        .get('/admin/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(groupsRes.body.data.length).toBeGreaterThan(0);

      const adminExpensesRes = await request(app.getHttpServer())
        .get('/admin/expenses')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          group_id: groupId,
          has_receipt: true,
        })
        .expect(200);

      expect(Array.isArray(adminExpensesRes.body.data)).toBe(true);

      if (adminExpensesRes.body.data.length > 0) {
        const adminExpenseId = adminExpensesRes.body.data[0].id as string;

        await request(app.getHttpServer())
          .get(`/admin/expenses/${adminExpenseId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        await request(app.getHttpServer())
          .delete(`/admin/expenses/${adminExpenseId}/receipt`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      }
    });

    it('admin can list groups without pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          disable_pagination: true,
          category: 'Travel',
        })
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('admin can list expenses without pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/expenses')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          disable_pagination: true,
          group_id: groupId,
        })
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });

    // ===== Group archive / leave / permissions =====

    it('archives and unarchives group, then member leaves', async () => {
      const archiveRes = await request(app.getHttpServer())
        .patch(`/groups/${groupId}/archive`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(archiveRes.body.data.is_archived).toBe(true);

      const unarchiveRes = await request(app.getHttpServer())
        .patch(`/groups/${groupId}/unarchive`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(unarchiveRes.body.data.is_archived).toBe(false);

      await request(app.getHttpServer())
        .post(`/groups/${groupId}/leave`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      const membersRes = await request(app.getHttpServer())
        .get(`/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(membersRes.body.data.length).toBe(1);
    });

    it('rejects group detail for admin user who is not a member', async () => {
      await request(app.getHttpServer())
        .get(`/groups/${groupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('rejects balances endpoint for non-existent group', async () => {
      await request(app.getHttpServer())
        .get('/groups/87dec907-8e3f-43cf-86e1-208d1dba6c81/balances')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('Negative auth and access cases', () => {
    const randomEmail = `random_${Date.now()}@example.com`;

    it('fails login with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: randomEmail,
          password: 'wrongpass',
        })
        .expect(401);
    });

    it('fails register with invalid payload', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'not-an-email',
          name: 'Ab',
          password: '123',
        })
        .expect(400);
    });

    it('rejects protected endpoints without token', async () => {
      await request(app.getHttpServer()).get('/groups').expect(401);

      await request(app.getHttpServer()).get('/user/activity').expect(401);
    });
  });

  describe('Authorization checks for admin routes', () => {
    let normalToken: string;

    it('creates a normal user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `noadmin_${Date.now()}@example.com`,
          name: 'No Admin',
          password: 'password123',
        })
        .expect(201);

      normalToken = res.body.data.access_token;
    });

    it('rejects access to admin endpoints for non admin user', async () => {
      await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${normalToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/admin/groups')
        .set('Authorization', `Bearer ${normalToken}`)
        .expect(403);
    });
  });

  describe('AppExceptionFilter behavior', () => {
    const duplicateEmail = `dupe@example.com`;

    it('wraps Prisma P2002 unique constraint as 409 with friendly message', async () => {
      // First register succeeds
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: duplicateEmail,
          name: 'Dup User',
          password: 'password123',
        })
        .expect(201);

      // Second register with same email triggers P2002 → handled by AppExceptionFilter
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: duplicateEmail,
          name: 'Dup User Again',
          password: 'password123',
        })
        .expect(409);

      expect(res.body).toHaveProperty('code', 409);
      expect(res.body).toHaveProperty('message', 'Email is already registered');
    });

    it('wraps validation errors from HttpException into code + message', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'not-an-email',
          name: 'Ab',
          password: '123',
        })
        .expect(400);

      // Comes from ValidationPipe → HttpException branch in AppExceptionFilter
      expect(res.body).toHaveProperty('code', 400);
      expect(res.body).toHaveProperty('message');
    });
  });
});
