import { createStore } from 'vuex';

const store = createStore({
  state() {
    return {
      user: null,
      token: localStorage.getItem('token') || ''
    };
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    setToken(state, token) {
      state.token = token;
    },
  },
  actions: {
    login({ commit }, userData) {
      commit('setUser', userData.user);
      commit('setToken', userData.token);
    },
    logout({ commit }) {
      commit('setUser', null);
      commit('setToken', '');
      localStorage.removeItem('token');
    },
  },
  getters: {
    isAuthenticated(state) {
      return state.token !== '';
    },
    getUser(state) {
      return state.user;
    },
    getToken(state) {
      return state.token;
    },
  }
});

export default store;
