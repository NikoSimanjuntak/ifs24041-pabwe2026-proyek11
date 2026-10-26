/** Error HTTP dengan kode status & detail validasi opsional. */
export class HttpError extends Error {
  constructor(status, message, data = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

export const notFound = (what = 'Data') => new HttpError(404, `${what} tidak ditemukan.`);
