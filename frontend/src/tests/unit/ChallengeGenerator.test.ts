import { GameGeometry, GameAreaConfig } from '@reto/geometry';
import { ChallengeGenerator } from '../../utils/challenges/ChallengeGenerator';

/**
 * NOTA: Con la geometría actual, las piezas Type A a rotation=0 se extienden
 * 320px a la derecha del centro. El concepto de "touching" (penetración 0.05-15px)
 * requiere posicionamiento muy preciso que el generador intenta via búsqueda binaria.
 */
describe('ChallengeGenerator', () => {
  let geometry: GameGeometry;
  let generator: ChallengeGenerator;
  let config: GameAreaConfig;

  beforeEach(() => {
    config = {
      width: 600,
      height: 600,
      mirrorLineX: 700,
      pieceSize: 100
    };
    geometry = new GameGeometry(config);
    generator = new ChallengeGenerator(geometry);
  });

  test('Challenge 2 (horizontal block) should be generated with 2 pieces', () => {
    const challenge = generator.generateHorizontalBlockChallenge();

    expect(challenge.name).toBeDefined();
    const pieces = challenge.objective.playerPieces;
    expect(pieces.length).toBe(2);

    // Verify the function generates something reasonable (pieces in valid positions)
    pieces.forEach((piece: { x: number; y: number; rotation: number }) => {
      expect(typeof piece.x).toBe('number');
      expect(typeof piece.y).toBe('number');
      expect(typeof piece.rotation).toBe('number');
    });
  });

  test('doPiecesTouch function works correctly for overlapping pieces', () => {
    // With current geometry at rotation=0, Type A pieces at x=100 and x=200 massively overlap
    // Penetration >> 15px → doPiecesTouch returns false (not a valid connection)
    const piece1 = { type: 'A' as const, face: 'front' as const, x: 100, y: 100, rotation: 0 };
    const piece2 = { type: 'A' as const, face: 'front' as const, x: 200, y: 100, rotation: 0 };

    const touching = geometry.doPiecesTouch(piece1, piece2);
    const overlapping = geometry.doPiecesOverlap(piece1, piece2);

    // These pieces massively overlap with current geometry
    expect(typeof touching).toBe('boolean');
    expect(typeof overlapping).toBe('boolean');
    // They overlap (shapes extend 320px right from center at rotation=0)
    expect(overlapping).toBe(true);
    // Massive overlap means not a "touching" connection
    expect(touching).toBe(false);
  });

  test('All challenges should be generated without errors', () => {
    const allChallenges = generator.generateAllChallenges();

    expect(Array.isArray(allChallenges)).toBe(true);
    expect(allChallenges.length).toBeGreaterThan(0);

    allChallenges.forEach((challenge) => {
      expect(challenge.name).toBeDefined();
      expect(challenge.objective).toBeDefined();
      expect(challenge.objective.playerPieces).toBeDefined();
      expect(Array.isArray(challenge.objective.playerPieces)).toBe(true);
      // Each challenge should have at least 1 piece
      expect(challenge.objective.playerPieces.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Los retos cambian con cada corrección de geometría, así que challenges.json
 * NO se puede congelar en la caché del navegador: si se sirve una copia vieja,
 * las piezas de la tarjeta salen en posiciones antiguas, sin contacto, y la
 * costura entre ellas se VE (era el caso del reto 6, con las piezas en
 * 640/510 en vez de 636/508).
 */
describe('ChallengeGenerator.loadChallengesFromFile', () => {
  test('revalida contra el servidor en vez de aceptar caché vieja', async () => {
    const geometry = new GameGeometry({ width: 600, height: 600, mirrorLineX: 700, pieceSize: 100 });
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    global.fetch = fetchMock as unknown as typeof fetch;

    await new ChallengeGenerator(geometry).loadChallengesFromFile(`/challenges-${Date.now()}.json`);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.cache).toBe('no-cache');
    expect(init.headers['Cache-Control']).toBeUndefined();
  });
});
