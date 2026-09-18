const ROOM_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_USERNAME_LENGTH = 32;
const MAX_MESSAGE_LENGTH = 500;
const MAX_PIECES_PER_SOLUTION = 16;

const isPayloadObject = (payload) => (
  typeof payload === 'object' && payload !== null && !Array.isArray(payload)
);

const validateRoomPayload = (payload) => (
  isPayloadObject(payload)
  && typeof payload.roomId === 'string'
  && ROOM_ID_PATTERN.test(payload.roomId)
    ? { roomId: payload.roomId }
    : null
);

const validateJoinPayload = (payload) => {
  const room = validateRoomPayload(payload);
  if (!room || typeof payload.username !== 'string') return null;

  const username = payload.username.trim();
  if (!username || username.length > MAX_USERNAME_LENGTH) return null;

  return { ...room, username };
};

const validateMessagePayload = (payload) => {
  const room = validateRoomPayload(payload);
  if (!room || typeof payload.message !== 'string' || payload.message.length > MAX_MESSAGE_LENGTH) {
    return null;
  }

  return { ...room, message: payload.message };
};

const validateSolvePayload = (payload) => {
  const room = validateRoomPayload(payload);
  if (!room || !Array.isArray(payload.pieces) || payload.pieces.length > MAX_PIECES_PER_SOLUTION) return null;

  const piecesAreValid = payload.pieces.every((piece) => (
    isPayloadObject(piece)
    && (piece.type === 'A' || piece.type === 'B')
    && (piece.face === 'front' || piece.face === 'back')
    && typeof piece.placed === 'boolean'
    && Number.isFinite(piece.x)
    && Number.isFinite(piece.y)
    && Number.isFinite(piece.rotation)
  ));

  return piecesAreValid ? { ...room, pieces: payload.pieces } : null;
};

module.exports = {
  isPayloadObject,
  validateRoomPayload,
  validateJoinPayload,
  validateMessagePayload,
  validateSolvePayload
};
