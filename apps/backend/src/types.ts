export interface ServiceResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string; // "validation_error", "server_error", "not_found" gibi
}
