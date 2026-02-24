import Cookies from 'universal-cookie';

const cookies = new Cookies();

export const getToken = (): string => {
  return cookies.get('token_spilibilo');
};

export const setToken = (token: string): void => {
  cookies.set('token_spilibilo', token, {
    path: '/',
  });
};

export const removeToken = (): void => {
  cookies.remove('token_spilibilo', {
    path: '/',
  });
};

export const getRefreshToken = (): string => {
  return cookies.get('token_spilibilo_refresh');
};

export const setRefreshToken = (token: string): void => {
  cookies.set('token_spilibilo_refresh', token, {
    path: '/',
  });
};

export const removeRefreshToken = (): void => {
  cookies.remove('token_spilibilo_refresh', {
    path: '/',
  });
};
