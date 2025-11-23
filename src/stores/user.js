import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref('')
    const role = ref('')
    const realName = ref('')
    const id = ref('')
    const username = ref('')
    const setRealName = (newRealName) =>{
      realName.value = newRealName
    }
    const removeRealName = () => {
      realName.value = ''
    }
    const setUsername = (newUsername) =>{
      username.value = newUsername
    }
    const removeUsername = () => {
      username.value = ''
    }
    const setToken = (newToken) => {
      token.value = newToken
    }

    const removeToken = () => {
      token.value = ''
    }

    const setRole = (newRole) => {
      role.value = newRole
    }

    const removeRole = () => {
      role.value = ''
    }


    const setId = (newId) => {
      id.value = newId
    }
    const removeId = () => {
      id.value = 0
    }
    return {
      token,
      setToken,
      removeToken,
      role,
      setRole,
      removeRole,
      id,
      setId,
      removeId,
      realName,
      setRealName,
      removeRealName,
      username,
      setUsername,
      removeUsername,
    }
  },
  {
    persist: {
      key: 'user',
      storage: localStorage,
      pick: ['token', 'role', 'id',"username","realName"], // 使用pick而不是paths
    },
  },
)
