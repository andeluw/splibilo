// Minimal mock so importing @google/generative-ai does not hit real SDK
jest.mock('@google/generative-ai', () => ({
  __esModule: true,
  GoogleGenerativeAI: jest.fn(),
}));

describe('geminiClient (src/lib/gemini)', () => {
  const GEMINI_PATH = '../src/lib/gemini';

  beforeEach(() => {
    jest.resetModules(); // important so the if-check re-runs with fresh env
  });

  it('does NOT throw when GEMINI_API_KEY is present (false branch of if)', () => {
    process.env.GEMINI_API_KEY = 'test-api-key';

    expect(() => {
      // isolate so module is evaluated with current env
      jest.isolateModules(() => {
        const mod = require(GEMINI_PATH);
        expect(mod.geminiClient).toBeDefined();
      });
    }).not.toThrow();
  });

  it('throws when GEMINI_API_KEY is missing (true branch of if)', () => {
    delete process.env.GEMINI_API_KEY;

    expect(() => {
      jest.isolateModules(() => {
        require(GEMINI_PATH);
      });
    }).toThrow('GEMINI_API_KEY is required');
  });
});
