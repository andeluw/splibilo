import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { geminiClient } from '../../lib/gemini';

export type ParsedReceiptItem = {
  name: string;
  quantity: number;
  amount: number;
};

export type ParsedReceipt = {
  items: ParsedReceiptItem[];
  subtotal: number | null;
  tax: number | null;
  grand_total: number | null;
};

@Injectable()
export class ReceiptLlmService {
  private readonly modelId = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  async parseRawText(rawText: string): Promise<ParsedReceipt> {
    if (!rawText || !rawText.trim()) {
      throw new InternalServerErrorException('Empty OCR text');
    }

    const systemPrompt = `
You parse receipts.

You will receive raw OCR text from a photo of a shopping or restaurant receipt.
The text may be messy, broken across lines, or contain random symbols.

Return ONE JSON object with this shape:

{
  "items": [
    { "name": string, "quantity": number, "amount": number }
  ],
  "subtotal": number | null,
  "tax": number | null,
  "grand_total": number | null
}

Rules:
- "name": cleaned item name, remove internal codes like E1106 or PLU.
- "quantity": integer quantity purchased. If unclear, use 1.
- "amount": total line price (not unit price), in IDR with dots/commas removed.
  Examples: "35.000", "35,000", "35,000.00" -> 35000
- Ignore phone numbers, invoice IDs, URLs, customer IDs, and cashier names.
- Ignore payment method lines: "Bayar", "Cash", "Debit", "QRIS", "Kembali", "Change".
- If subtotal not printed, use null.
- If tax (PPN/Pajak/Service) not printed, use null.
- If only a single final total appears, put it in "grand_total" and keep subtotal/tax null.
- Merge multi-line items into a single clean name when needed.
- Do not invent items.

Output ONLY the JSON object. Do not add any explanation.
    `.trim();

    try {
      const model = geminiClient.getGenerativeModel({
        model: this.modelId,
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nOCR TEXT:\n${rawText}` }],
          },
        ],
      });

      const text = result.response.text();
      // console.log('Gemini raw JSON:', text);

      const parsed = JSON.parse(text) as ParsedReceipt;

      const items = Array.isArray(parsed.items) ? parsed.items : [];

      return {
        items: items.map((item) => ({
          name: String(item.name ?? '').trim(),
          quantity: Number(item.quantity ?? 1) || 1,
          amount: Number(item.amount ?? 0) || 0,
        })),
        subtotal:
          parsed.subtotal === null || parsed.subtotal === undefined
            ? null
            : Number(parsed.subtotal) || 0,
        tax:
          parsed.tax === null || parsed.tax === undefined
            ? null
            : Number(parsed.tax) || 0,
        grand_total:
          parsed.grand_total === null || parsed.grand_total === undefined
            ? null
            : Number(parsed.grand_total) || 0,
      };
    } catch (err) {
      // console.error('Gemini receipt error:', err);
      throw new InternalServerErrorException(
        'Failed to parse receipt with Gemini',
      );
    }
  }
}
