import type { Transporter } from 'nodemailer';
import { MailService } from '../src/modules/mail/mail.service';

describe('MailService (unit-style in E2E project)', () => {
  let sendMailMock: jest.Mock;

  const createServiceWithEnv = (env: {
    FRONTEND_URL?: string;
    MAIL_FROM_ADDRESS?: string;
    MAIL_FROM_NAME?: string;
  }) => {
    // Reset relevant env
    delete process.env.FRONTEND_URL;
    delete process.env.MAIL_FROM_ADDRESS;
    delete process.env.MAIL_FROM_NAME;

    if (env.FRONTEND_URL) process.env.FRONTEND_URL = env.FRONTEND_URL;
    if (env.MAIL_FROM_ADDRESS) {
      process.env.MAIL_FROM_ADDRESS = env.MAIL_FROM_ADDRESS;
    }
    if (env.MAIL_FROM_NAME) {
      process.env.MAIL_FROM_NAME = env.MAIL_FROM_NAME;
    }

    const transporter: Partial<Transporter> = {
      sendMail: sendMailMock as any,
    };

    return new MailService(transporter as Transporter);
  };

  beforeEach(() => {
    sendMailMock = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('wrapHtml uses title as preview text when previewText is not provided', () => {
    const service = createServiceWithEnv({
      FRONTEND_URL: 'https://ignored.example.com',
      MAIL_FROM_ADDRESS: 'from@test.com',
      MAIL_FROM_NAME: 'TestSplibilo',
    });

    const html = (service as any).wrapHtml({
      title: 'Sample Title',
      content: '<p>Hello world</p>',
    });

    expect(html).toContain('Sample Title');
    expect(html).toContain('<p>Hello world</p>');
    // Brand header always says Splibilo
    expect(html).toContain('Splibilo');
  });

  it('wrapHtml uses custom previewText when provided', () => {
    const service = createServiceWithEnv({});

    const html = (service as any).wrapHtml({
      title: 'Another Title',
      previewText: 'This is preview',
      content: '<p>Body</p>',
    });

    expect(html).toContain('Another Title');
    expect(html).toContain('This is preview');
    expect(html).toContain('<p>Body</p>');
  });

  it('sendGroupInviteMail uses explicit from env and builds correct email', async () => {
    const service = createServiceWithEnv({
      FRONTEND_URL: 'https://ignored.example.com', // ignored inside module due to top-level const
      MAIL_FROM_ADDRESS: 'test-from@example.com',
      MAIL_FROM_NAME: 'TestSplibilo',
    });

    await service.sendGroupInviteMail({
      to: 'invitee@example.com',
      groupName: 'Trip Bali',
      inviteCode: 'INV123',
      inviteId: 'invite-1',
    });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const mailArgs = sendMailMock.mock.calls[0][0];

    expect(mailArgs.from).toBe('"TestSplibilo" <test-from@example.com>');
    expect(mailArgs.to).toBe('invitee@example.com');
    expect(mailArgs.subject).toContain('Trip Bali');

    // Text version
    expect(mailArgs.text).toContain(
      'You have been invited to join the group "Trip Bali".',
    );
    // Uses default frontendUrl defined at module top: http://localhost:3000
    expect(mailArgs.text).toContain('http://localhost:3000/login');
    expect(mailArgs.text).toContain('INV123');

    // HTML version
    expect(mailArgs.html).toContain('Join group');
    expect(mailArgs.html).toContain('INV123');
    expect(mailArgs.html).toContain('http://localhost:3000/login');
  });

  it('sendGroupInviteMail falls back to default from address and name when env missing', async () => {
    const service = createServiceWithEnv({}); // no MAIL_FROM_* set

    await service.sendGroupInviteMail({
      to: 'invitee@example.com',
      groupName: 'Trip Default',
      inviteCode: 'CODE999',
      inviteId: 'invite-2',
    });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const mailArgs = sendMailMock.mock.calls[0][0];

    // Defaults from service
    expect(mailArgs.from).toBe('"Splibilo" <no-reply@example.com>');
    expect(mailArgs.text).toContain('http://localhost:3000/login');
    expect(mailArgs.html).toContain('http://localhost:3000/login');
  });

  it('sendSettlementReceivedMail uses default currency (IDR) and no notes', async () => {
    const service = createServiceWithEnv({
      FRONTEND_URL: 'https://ignored.example.com',
    });

    await service.sendSettlementReceivedMail({
      to: 'receiver@example.com',
      receiverName: 'Bob',
      senderName: 'Alice',
      amount: 100_000,
      groupName: 'Trip Bali',
      groupId: 'group-1',
      settlementId: 'settlement-1',
      notes: undefined,
    });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const mailArgs = sendMailMock.mock.calls[0][0];

    expect(mailArgs.subject).toContain('You received a settlement from Alice');
    expect(mailArgs.text).toContain('Hi Bob');
    expect(mailArgs.text).toContain('Amount: IDR 100.000');
    expect(mailArgs.text).toContain(
      'http://localhost:3000/groups/group-1/settlements',
    );

    expect(mailArgs.html).toContain('IDR 100.000');
    expect(mailArgs.html).toContain('View settlement');
    // When notes is undefined, notes block should not be rendered
    expect(mailArgs.html).not.toContain('Notes:');
  });

  it('sendSettlementReceivedMail includes notes when provided (and custom currency)', async () => {
    const service = createServiceWithEnv({
      FRONTEND_URL: 'https://ignored.example.com',
    });

    await service.sendSettlementReceivedMail({
      to: 'receiver@example.com',
      receiverName: 'Bob',
      senderName: 'Alice',
      amount: 50_000,
      currency: 'USD',
      groupName: 'Trip Bali',
      groupId: 'group-1',
      settlementId: 'settlement-2',
      notes: 'Thanks for covering dinner!',
    });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const mailArgs = sendMailMock.mock.calls[0][0];

    expect(mailArgs.text).toContain('Amount: USD 50.000');
    expect(mailArgs.text).toContain('Notes: Thanks for covering dinner!');
    expect(mailArgs.html).toContain('Notes:');
    expect(mailArgs.html).toContain('Thanks for covering dinner!');
  });

  it('sendSettlementReceivedMail handles notes = null branch', async () => {
    const service = createServiceWithEnv({
      FRONTEND_URL: 'https://ignored.example.com',
    });

    await service.sendSettlementReceivedMail({
      to: 'receiver@example.com',
      receiverName: 'Bob',
      senderName: 'Alice',
      amount: 25_000,
      currency: 'EUR',
      groupName: 'Trip Bali',
      groupId: 'group-2',
      settlementId: 'settlement-3',
      notes: null, 
    });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const mailArgs = sendMailMock.mock.calls[0][0];

    expect(mailArgs.text).toContain('Amount: EUR 25.000');
    expect(mailArgs.text).not.toContain('Notes:');
    expect(mailArgs.html).not.toContain('Notes:');
  });
});
