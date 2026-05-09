/**
 * GLTF helpers
 *
 * Centralizes Draco/Meshopt configuration so we can self-host the decoders
 * (avoiding the gstatic CDN drei uses by default).
 *
 * Usage:
 *   const { scene } = useGLTF('models/foo.glb', DRACO_DECODER_PATH);
 *   useGLTF.preload('models/foo.glb', DRACO_DECODER_PATH);
 *
 * The decoder files must be present in `public/draco/`
 * (gltf, gltf+wasm). drei resolves the path with the Vite base URL
 * automatically when using a relative path beginning with the base.
 */

const baseUrl =
    typeof import.meta !== 'undefined' && import.meta.env
        ? import.meta.env.BASE_URL || '/'
        : '/';

// Local Draco decoder folder (served from /public/draco/gltf/).
// Trailing slash is required by THREE.DRACOLoader.setDecoderPath().
export const DRACO_DECODER_PATH = `${baseUrl}draco/gltf/`;
