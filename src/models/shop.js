import {getStoreList, getGoodsList, getGoodsNorm, getPresentGood} from '../services/shop'

export default {
  namespace: 'shop',
  state: {
    mustList: [],
    group:[],
    fullDiscount: [],
    storeRecommend: {},
    s_business: 1
  },

  effects: {
    * getStoreList({payload}, {put, call}) {
      return yield call(getStoreList, payload)
    },
    * getGoodsList({payload}, {put, call}) {
      const res = yield call(getGoodsList, payload)
      if(res.group && res.group[0] && res.group[0].gg_must == 1) {
        yield put({
					type: 'saveMustList',
					payload: res.group[0].goods_list
				});
      }
      yield put({
        type: 'saveFullDiscount',
        payload: res.full_discount
      });
      yield put({
        type: 'saveStoreBusiness',
        payload: res.s_business
      });
      yield put({
        type: 'saveStoreRecommend',
        payload: res.storeRecommend
      });
      yield put({
        type: 'saveGroup',
        payload: res.group
      });
      return yield call(getGoodsList, payload)
    },
    * getGoodsNorm({payload}, {put, call}) {
      return yield call(getGoodsNorm, payload)
    },
    * getPresentGood({payload}, {put, call}) {
      return yield call(getPresentGood, payload)
    },
  },

  reducers: {
    saveMustList(state, action) {
      return {
        ...state,
        mustList: action.payload,
      };
    },
    saveGroup(state, action) {
      return {
        ...state,
        group: action.payload,
      };
    },
    saveFullDiscount(state, action) {
      return {
        ...state,
        fullDiscount: action.payload,
      };
    },
    saveStoreBusiness(state, action) {
      return {
        ...state,
        s_business: action.payload,
      };
    },
    saveStoreRecommend(state, action) {
      return {
        ...state,
        storeRecommend: action.payload,
      };
    }
  }
}
