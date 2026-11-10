const getOrigin = () => {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return "http://localhost:8000";
};

export const apiConfig = {
  // ==========================================
  // DYNAMIC / LOCAL / PRODUCTION ENVIRONMENT
  // ==========================================
  get domain() {
    return getOrigin();
  },
  get base_url() {
    return `${getOrigin()}/api`;
  },
  get auth_generate_url() {
    return `${getOrigin()}/api/auth/generate-secure-url?token=NDc3&module=sales`;
  }
};

