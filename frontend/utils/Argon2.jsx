import { Argon2, Argon2Mode } from '@sphereon/isomorphic-argon2';

/**
 * Maps a string type to the Argon2Mode enum
 * @param {'argon2i' | 'argon2d' | 'argon2id'} type
 * @returns {Argon2Mode}
 */
function getArgon2Mode(type) {
  switch (type) {
    case 'argon2i':
      return Argon2Mode.Argon2i;
    case 'argon2d':
      return Argon2Mode.Argon2d;
    case 'argon2id':
    default:
      return Argon2Mode.Argon2id;
  }
}

/**
 * Hash a password with Argon2
 * @param {string} password
 * @param {string} salt - Base64-encoded salt
 * @param {Object} options
 * @param {number} options.iterations - Time cost
 * @param {number} options.memory - Memory cost in KiB
 * @param {number} options.parallelism - Degree of parallelism
 * @param {number} options.hashLength - Length of the output hash in bytes
 * @param {'argon2i' | 'argon2d' | 'argon2id'} options.hashType
 * @returns {Promise<{ encoded: string, hex: string }>}
 */
export async function hashPassword(password, salt, options) {
  if (!password || !salt) {
    throw new Error('Password and salt are required');
  }

  const {
    iterations = 3,
    memory = 65536,
    parallelism = 2,
    hashLength = 32,
    hashType = 'argon2id',
  } = options;

  const mode = getArgon2Mode(hashType);

  return Argon2.hash(password, salt, {
    iterations,
    memory,
    parallelism,
    hashLength,
    mode,
  });
}
