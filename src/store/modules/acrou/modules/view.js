export default {
  namespaced: true,
  state: {
    // Set default view mode to 'grid'
    mode: "grid", // Change default value to "grid"
  },
  actions: {
    /**
     * @description 从持久化数据读取视图模式设置
     * @param {Object} context
     */
    load({ state, dispatch, commit }) {
      return new Promise(async (resolve) => {
        // Fetch stored view mode from persistent storage or use default
        const savedMode = await dispatch(
          "acrou/db/get",
          {
            dbName: "sys",
            path: "view.mode.value",
            defaultValue: "grid",  // Use 'grid' as the default if no saved value is found
            user: true,
          },
          { root: true }
        );
        
        // Update state with the loaded mode
        state.mode = savedMode;
        
        // Apply the mode change
        commit("set", state.mode);

        resolve();
      });
    },
    /**
     * @description 切换视图模式
     * @param {Object} context
     */
    toggle({ state, dispatch, commit }, mode) {
      return new Promise(async (resolve) => {
        // If mode is not passed, default to 'grid'
        state.mode = mode || "grid";

        // Save the selected mode to persistent storage
        await dispatch(
          "acrou/db/set",
          {
            dbName: "sys",
            path: "view.mode.value",
            value: state.mode,
            user: true,
          },
          { root: true }
        );
        
        // Apply the mode change
        commit("set", state.mode);

        resolve();
      });
    },
  },
  mutations: {
    /**
     * @description 设置 store 里的视图模式
     * @param {Object} state state
     * @param {String} mode mode ('list' or 'grid')
     */
    set(state, mode) {
      state.mode = mode;
    },
  },
};
