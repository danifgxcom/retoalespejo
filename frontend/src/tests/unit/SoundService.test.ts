import { SoundService } from '../../services/SoundService';

describe('sound preference', () => {
  beforeEach(() => localStorage.clear());
  test('starts silent and does not require Web Audio', async () => {
    const service = new SoundService();
    expect(service.enabled).toBe(false);
    await expect(service.unlock()).resolves.toBeUndefined();
    expect(() => service.play('success')).not.toThrow();
  });
  test('persists explicit opt-in and mute, independently of ambient sound', () => {
    const service = new SoundService();
    service.setEnabled(true);
    expect(new SoundService().enabled).toBe(true);
    service.setEnabled(false);
    expect(new SoundService().enabled).toBe(false);
    expect(() => service.setAmbient(true)).not.toThrow();
    expect(() => service.play('error')).not.toThrow();
  });
});
