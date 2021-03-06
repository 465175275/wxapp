import {postAddress, delAddress} from "../services/address";

export default {
  namespace: 'address',
  state: {
    curAddress: {}
  },

  effects: {
    * postAddress({payload}, {put, call}) {
      return yield call(postAddress, payload)
    },
    * delAddress({payload}, {put, call}) {
      return yield call(delAddress, payload)
    },
  },

  reducers: {
    setCurAddress(state, {payload}) {
      return {...state, curAddress: payload};
    },
  }
}
