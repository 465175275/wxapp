import Taro, {Component} from '@tarojs/taro'
import {View, Text, Image, Swiper, SwiperItem, ScrollView, Block} from '@tarojs/components'
import {AtToast} from 'taro-ui'
import {connect} from '@tarojs/redux'
import classnames from 'classnames'
import Modal from '../../components/modal'
import PayBox from '../../components/pay-box'
// import ConfirmModal from '../../components/confirm-modal'
import Loading from '../../components/Loading'
import Numbox from '../../components/num-box'
import Curtain from '../../components/curtain'
import './index.less'
import IdButton from "../../components/id-button/index"
import BackToHome from '../../components/back-to-home'
import searchPng from '../../assets/images/shop-search.png'
import addressPng from '../../assets/images/shop-address.png'

@connect(({common, cart, shop}) => ({...common, ...cart, ...shop}))
class ShopIndex extends Component {

  config = {
    navigationBarTitleText: '商品列表',
    disableScroll: true
  }

  state = {
    group: null,
    curGroupId: '',
    curGroupGoodId: '',
    curClassifyIndex: 0,
    isShowCart: false,
    isGoodNull: false,
    isShowDetail: false,
    isShowOptions: false,
    // isShowCartWarn: false,
    curCart: {},
    curGood: {},
    stanInfo: {},
    propertyTagIndex: [],
    optionalTagIndex: [],
    scrollCurGroupId: '',
    canScroll: false
  }

  componentWillMount() {

    Taro.showShareMenu({
      withShareTicket: true
    })

    this.setState({isShowCart: !!this.$router.params.showcart})
    const id = +this.$router.params.id

    !this.$router.params.fs_id &&
    this.props.carts[id] &&
    this.props.dispatch({
      type: 'cart/clearPresentCart',
      payload: {
        id
      }
    })
  }

  onShareAppMessage = () => {
    return {
      path: `pages/shop-index/index?id=${this.$router.params.id}&isShare=1`
    }
  }

  componentDidShow() {
    this.getGoodsList()
    const scroll = Taro.getStorageSync('scroll')
    if(scroll) {
      this.handleTop()
      Taro.removeStorage({ key: 'scroll' })
    }
  }

  getGoodsList = () => {
    const { latitude, longitude } = this.props.localInfo
    this.props.dispatch({
      type: 'shop/getGoodsList',
      payload: {
        store_id: +this.$router.params.id,
        address_lat: latitude,
        address_lng: longitude
      }
    }).then(({group, storeinfo}) => {
      if(group == undefined) {
        setTimeout(() => {
          Taro.navigateBack()
        }, 2500)
        return false
      }
      if (!group || group.length === 0) {
        Taro.showToast({
          title: '当前店铺尚未上架任何商品!',
          icon: 'none'
        })

        setTimeout(() => {
          Taro.navigateBack()
        }, 2500)

        return
      }

      this.setState({
        group,
        storeinfo
      }, this.calcAsideSize)

      this.goodPosition = []
      for (let i = 0; i < group.length; i++) {
        let height = 34 + 96 * group[i].goods_list.length
        let top = i === 0 ? 0 : this.goodPosition[i - 1].bottom
        this.goodPosition.push({
          group_id: group[i].group_id,
          index: i,
          top,
          bottom: top + height
        })
      }
    })
  }

  /**
   * 计算左侧总高度和单个项高度
   * */
  calcAsideSize = () => {
    const {group} = this.state

    if (group.length === 0) return

    if (!this.asideHeiInfo) {
      this.asideHeiInfo = {}
      let query = Taro.createSelectorQuery()
      query.select('#aside-scroll').boundingClientRect()
        .exec(res => {
          this.asideHeiInfo.wrapHeight = res[0].height
        })

      query.select('#asid-' + group[0].group_id).boundingClientRect()
        .exec(res => {
          this.asideHeiInfo.itemHeight = res[1].height
        })
    }
  }

  changeClassify = (index, scrollGood = true) => {
    // if(this.state.curClassifyIndex == index) return
    const {group} = this.state

    const {wrapHeight, itemHeight} = this.asideHeiInfo
    const asideScrollTop = this.asideScrollTop || 0
    const itemNums = Math.ceil(wrapHeight / itemHeight)
    let curGroupId
    if (index === 0) {
      curGroupId = 'asid-' + group[0].group_id
    } else if ((index - 1) * itemHeight <= asideScrollTop) {
      curGroupId = 'asid-' + group[index - 1].group_id
    } else if ((index + 2) * itemHeight > (asideScrollTop + wrapHeight) && index > itemNums - 3) {
      curGroupId = 'asid-' + group[index - itemNums + 3].group_id
    }
    this.setState({
      curClassifyIndex: index,
      curGroupId,
    })
    if (scrollGood) {
      this.setState({
        curGroupGoodId: 'id' + this.state.group[index].group_id,
        scrollCurGroupId: null
      })
      this.curGroupGoodId = this.state.group[index].group_id
    }
  }

  goodScroll = e => {
    const fix = e.detail.scrollHeight / (this.goodPosition[this.goodPosition.length - 1].bottom + 99)
    if (e.detail.scrollTop + this.asideHeiInfo.wrapHeight > e.detail.scrollHeight) return
    this.goodPosition.map(item => {
      if (e.detail.scrollTop >= Math.floor(item.top * fix) && e.detail.scrollTop < Math.floor(item.bottom  * fix)) {
        if (this.curGroupGoodId !== this.state.group[item.index].group_id) {
          this.setState({
            scrollCurGroupId: item.group_id,
            curGroupGoodId: null
          })
        } else{
          this.curGroupGoodId = null
        }
        this.changeClassify(item.index, false)
      }
    })
  }

  ToggleShowCart = () => {
    this.setState({isShowCart: !this.state.isShowCart})
  }

  closeCart = () => {
    this.setState({isShowCart: false})
  }

  showDetail = (good) => {
    const carts = this.props.carts[(+this.$router.params.id)] || []
    const curCart = JSON.parse(JSON.stringify(carts.find(item => item.g_id === good.g_id) || {}))


    this.setState({
      isShowDetail: true,
      curGood: good,
      curCart
    })
  }

  closeDetail = () => {
    this.setState({isShowDetail: false})
  }

  openOptions = (good, e) => {
    e && e.stopPropagation()

    this.setState({
      isShowCart: false,
      curGood: good,
    })
    Taro.showNavigationBarLoading()
    this.props.dispatch({
      type: 'shop/getGoodsNorm',
      payload: {
        store_id: +this.$router.params.id,
        goods_id: good.g_id
      }
    }).then(res => {
      const propertyTagIndex = Array.from({length: res.property.length}, () => 0)
      const optionalTagIndex = Array.from({length: res.norm.optional.length}, () => 0)

      const carts = this.props.carts[(+this.$router.params.id)] || []
      const optionalstr = propertyTagIndex.join('') + optionalTagIndex.join('')
      const cartsAlike = carts.find(item => (
        !item.fs_id &&
        (item.g_id === good.g_id) && (item.optionalstr === optionalstr)
      ))
      const curCart = JSON.parse(JSON.stringify(cartsAlike || {}))

      this.setState({
        isShowOptions: true,
        stanInfo: res,
        curCart,
        propertyTagIndex,
        optionalTagIndex,
      }, Taro.hideNavigationBarLoading)

    })
  }

  closeOptions = () => {
    this.setState({
      isShowOptions: false,
      stanInfo: {}
    })
  }

  selectTag = (key, index, i) => {

    let stan = this.state[key]
    stan[index] = i
    this.setState({[key]: stan}, this.setCurCart)
  }

  setCurCart = () => {
    const {propertyTagIndex, optionalTagIndex, curGood} = this.state

    const carts = this.props.carts[(+this.$router.params.id)] || []
    const optionalstr = propertyTagIndex.join('') + optionalTagIndex.join('')
    const cartsAlike = carts.find(item => (
      (item.g_id === curGood.g_id) && (item.optionalstr === optionalstr)
    ))
    const curCart = JSON.parse(JSON.stringify(cartsAlike || {}))

    this.setState({curCart})
  }

  toChooseStan = () => {
    this.setState({isShowDetail: false})
    this.openOptions(this.state.curGood)
  }

  setCart = (good, num, cartGood) => {
    if (num === -1 && (!cartGood.num || cartGood.num <= 0)) return

    this.props.dispatch({
      type: 'cart/setCart',
      payload: {
        id: +this.$router.params.id,
        good: {
          ...good,
          again_id: undefined,
        },
        num
      }
    })

    this.setCurCart()
  }

  setComboCart = (good, num) => {
    this.props.dispatch({
      type: 'cart/setComboCart',
      payload: {
        id: +this.$router.params.id,
        good: {
          ...good,
          again_id: undefined,
        },
        num
      }
    })
    this.setCurCart()
  }


  setLocalCart = num => {
    const {curGood, stanInfo, propertyTagIndex, optionalTagIndex} = this.state
    const curCart = JSON.parse(JSON.stringify(this.state.curCart))
    !curCart.num && (curCart.num = 0)
    curCart.num += num
    curCart.optionalstr = propertyTagIndex.join('') + optionalTagIndex.join('')
    this.setState({curCart})

    let normInfo = {}
    if (stanInfo.property) {
      normInfo = {
        property: JSON.parse(JSON.stringify(stanInfo.property)),
        optional: JSON.parse(JSON.stringify(stanInfo.norm.optional)),
        propertyTagIndex: JSON.parse(JSON.stringify(propertyTagIndex)),
        optionalTagIndex: JSON.parse(JSON.stringify(optionalTagIndex)),
        optionalstr: propertyTagIndex.join('') + optionalTagIndex.join(''),
      }
    }

    const good = {
      ...curGood,
      ...curCart,
      ...normInfo
    }

    this.props.dispatch({
      type: 'cart/setCart',
      payload: {
        id: +this.$router.params.id,
        good,
        num
      }
    })
  }


  clearCart = () => {
    this.props.dispatch({
      type: 'cart/clearOneCart',
      payload: {
        id: +this.$router.params.id,
      }
    })
    this.setState({
      isShowCart: false,
      // isShowCartWarn: false,
      isShowOptions: false,
      isShowDetail: false
    })
  }

  toStandardDetail = (good) => {
    this.setState({isShowDetail: false})
    Taro.navigateTo({
      url: `/pages/standard-detail/index?store_id=${this.$router.params.id}&id=${good.g_id}&name=${good.g_title}&g_price=${good.g_price}&g_original_price=${good.g_original_price}&g_limit_num=${good.g_limit_num}`
    })
  }

  stopPropagation = e => {
    e.stopPropagation()
  }

  asideScroll = e => {
    this.asideScrollTop = e.detail.scrollTop
  }

  handleTop = () => {
    this.changeClassify(0, true)
  }

  handlePay = () => {
    this.setState({
      isShowOptions: false,
      isShowDetail: false
    })
  }

  askClearCart = () => {
    Taro.showModal({
      content: '清空购物车？'
    }).then(({confirm}) => {
      confirm && this.clearCart()
    })
  }

  linkToSearch = () => {
    Taro.navigateTo({
      url: `/pages/shop-search/index?id=${this.$router.params.id}&search=true`
    })
  }

  lookAddress = () => {
    const { storeinfo } = this.state
    Taro.openLocation({
      latitude: +storeinfo.address_lat,
      longitude: +storeinfo.address_lng,
      name: storeinfo.s_title,
      scale: 18
    })
  }

  checkRecommend = (item, index) => {
    if(item.type == 5) {
      return false
    }
    item.type == 4 && item.goods_id && this.showDetail(item.goodsInfo)
    if(item.type < 4) {
      Taro.navigateTo({
        url: `/pages/shop-search/index?id=${this.$router.params.id}&type=${item.type}&recommendIndex=${index}`
      })
    }
  }

  render() {
    const {theme, menu_banner, menu_cart, fullDiscount, storeRecommend} = this.props
    const {id, fs_id} = this.$router.params
    const carts = (this.props.carts[+id] || []).filter(item => !item.fs_id || item.fs_id === +fs_id)
    let limitText = ['每单', '每天', '每人']
    const {
      group, curClassifyIndex, isShowCart, isGoodNull,
      isShowDetail, isShowOptions, curGroupId, curGood, curCart,
      curGroupGoodId, stanInfo, propertyTagIndex, canScroll,
      optionalTagIndex, scrollCurGroupId, storeinfo
    } = this.state
    return (
      group ?
      <ScrollView scrollY className={`shop-index ${(storeRecommend.r_type > 0 ) ? 'hasAction' : ''}`}>
        <View className='banner'>
          <View className='shop-content'>
            <Image className='shop-img' src={storeinfo.s_image || ''}/>
            <View className='shop-detail'>
              <View className='shop-name'>{storeinfo.s_title}</View>
              <View className='shop-address'>{storeinfo.s_address}</View>
              <View className='shop-apps'>
                <View className='app-item' onClick={() => { this.lookAddress()}}>
                  <Image className='app-img' src={addressPng}/>
                  <View className='app-name'>距您{storeinfo.distance}</View>
                </View>
                <View className='app-item search-panel' onClick={() => { this.linkToSearch()}}>
                  <Image className='app-img' src={searchPng}/>
                  <View className='app-name'>搜索商品</View>
                </View>
              </View>
            </View>
          </View>
          {
            fullDiscount.length > 0 &&
            <View className='full_discount'>
              {
                fullDiscount.map((item, index) => (
                  <View className={`discount-item theme-bd-${theme} theme-c-${theme}`} key={index}>
                    {item.f}减{item.d}
                  </View>
                ))
              }
            </View>
          }
        </View>
        <View className={`recommend ${storeRecommend.r_type == 1 ? 'style1' : ''} ${storeRecommend.r_type == 2 > 0 ? 'style2' : ''}`}>
          {
            storeRecommend.r_type == 1 &&
            <View className="style-group style1-group">
              <View className='style-title'>推荐商品</View>
              <ScrollView scrollWithAnimation scrollX={true} className='style1-goods'>
                {
                  storeRecommend.goodsList && storeRecommend.goodsList[0].map((good, index) => {
                    const _cartGood = carts.find(item => !item.fs_id && (item.g_id === good.g_id))
                    return (
                      <View className='recommend-good' key={index}>
                        <View className='good-img' onClick={this.showDetail.bind(this, good)}>
                          <Image src={good.g_image_100 || ''}/>
                        </View>
                        <View className='name'> 
                          <Text onClick={this.showDetail.bind(this, good)}>{good.g_title}</Text>
                        </View>
                        <View
                          className='pre-price' style={{visibility: +good.g_original_price !== 0 ? 'visible' : 'hidden'}}
                        >
                          <Text class="yen">&yen;</Text>{good.g_original_price}
                        </View>
                        <View className='price'><Text class="yen">&yen;</Text>
                          <Text className='font-xin-normal'>{good.g_price}</Text>
                        </View>
                        <View className='handle' onClick={this.stopPropagation}>
                          {
                            good.g_combination === 1 &&
                            <Block>
                              {
                                good.g_has_norm === 2 &&
                                <Numbox
                                  num={_cartGood.num}
                                  showNum={_cartGood && _cartGood.num !== 0}
                                  onReduce={this.this.setCart.bind(this, good, -1, _cartGood)}
                                  onAdd={this.setCart.bind(this, good, 1)}
                                />
                              }
                              {
                                good.g_has_norm === 1 &&
                                <IdButton onClick={this.openOptions.bind(this, good)}
                                        className={'theme-bg-' + theme}
                                >选规格</IdButton>
                              }
                            </Block>
                          }

                          {
                            good.g_combination === 2 &&
                            <IdButton onClick={this.toStandardDetail.bind(this, good)}
                                    className={'theme-bg-' + theme}
                            >选规格</IdButton>
                          }
                        </View>   
                        {
                          good.g_limit != 0 &&
                          <Text className='red'>{limitText[good.g_limit - 1]}限购{good.g_limit_num}份</Text>
                        }
                      </View>
                    )
                  })
                }
              </ScrollView>
            </View>
          }
          {
            storeRecommend.r_type == 2 && 
            <View className="style-group style2-group">
              <View className='style-title'>活动专题</View>
              <Swiper
                indicatorColor='#999'
                indicatorActiveColor='#f00'
                circular
                autoplay={storeRecommend.recommend.activity && storeRecommend.recommend.activity.length > 1}
                interval={3 * 1000}
              >
                {
                  storeRecommend.recommend.activity && storeRecommend.recommend.activity.map((item, index) => (
                    <SwiperItem className='swiper-item' onClick={() => {this.checkRecommend(item, index)}} key={index}>
                      <View>
                        <Image className='swiper-img' src={item.image || ''}/>
                      </View>
                    </SwiperItem>
                  ))
                }
              </Swiper>
            </View>
          }
        </View>
        {
          group && group.length &&
          <View className={`menu ${fullDiscount.length > 0 ? 'discount' : ''}`}>
            <View className='aside'>
              <ScrollView
                scrollWithAnimation
                scrollY className='item-wrap'
                onScroll={this.asideScroll} scrollIntoView={curGroupId}
                id='aside-scroll'>
                <View className='bg-alias'>
                  {
                    group.map((classify, index) => (
                      <View key={index}/>
                    ))
                  }
                </View>
                {
                  group.map((classify, index) => (
                    <View
                      className={classnames('item', index === curClassifyIndex ? 'active' : '',
                        index === curClassifyIndex - 1 ? 'pre-active' : '',
                        index === curClassifyIndex + 1 ? 'af-active' : '')}
                      onClick={this.changeClassify.bind(this, index)}
                      key={index} id={'asid-' + classify.group_id}
                    >
                      {
                        classify.gg_must == 1 && <View className='must-icon'>必点</View>
                      }
                      <View>
                        {
                          classify.gg_image &&
                          <Image src={classify.gg_image || ''}/>
                        }
                        <Text>{classify.gg_name}</Text>
                      </View>
                    </View>
                  ))
                }
                <View className={classnames('null-block', curClassifyIndex === group.length - 1 ? 'radius' : '')}>
                  <View />
                </View>
              </ScrollView>
            </View>
            <ScrollView
              scrollWithAnimation
              className='content'
              scrollY scrollIntoView={curGroupGoodId}
              onScroll={this.goodScroll}
            >
              {
                group.map((classify, index) => (
                  <View className='good-block' key={index} id={'id' + classify.group_id}>
                    <View className='title' id={'title-' + classify.group_id}>
                        <View className={`${(scrollCurGroupId === classify.group_id && storeRecommend.r_type != 1 && storeRecommend.r_type != 2)? 'top-show' : ''} ${fullDiscount.length > 0 ? 'discount' : ''}`}
                        style={{zIndex: 20 + index}}
                      >
                        <Image src={classify.gg_image || ''}/>
                        <Text>{classify.gg_name}</Text>
                      </View>
                    </View>
                    <View className='good-list'>
                      {
                        classify.goods_list.map((good, i) => {
                          const cartGood = carts.find(item => !item.fs_id && (item.g_id === good.g_id))
                          return (
                            <View className={`good ${good.g_limit != 0 ? 'mb' : ''}`} key={i}>
                              <View className='img-wrap' onClick={this.showDetail.bind(this, good)}>
                                {
                                  good.tag_name &&
                                  <Text className={classnames('tag')} style={{background: good.tag_color}}>{good.tag_name}</Text>
                                }
                                {
                                  good.g_highlight &&
                                  <View className={`highlight`}>
                                    <View className={`theme-bg-${theme} bg`}></View>
                                    <Text>{good.g_highlight}</Text>
                                  </View>
                                }
                                <Image src={good.g_image_100 || ''}/>
                              </View>
                              <View className='info'>
                                <View className='name'> 
                                  <Text onClick={this.showDetail.bind(this, good)}>{good.g_title}</Text>
                                  {
                                    good.g_takeaway == 2 &&
                                    <View className='takeaway'>不外送</View>
                                  }
                                </View>
                                <View
                                  className='pre-price' style={{visibility: +good.g_original_price !== 0 ? 'visible' : 'hidden'}}
                                >
                                  <Text class="yen">&yen;</Text>{good.g_original_price}
                                </View>
                                <View className='price'><Text class="yen">&yen;</Text>
                                  <Text className='font-xin-normal'>{good.g_price}</Text>
                                </View>
                                <View className='handle' onClick={this.stopPropagation}>
                                  {
                                    good.g_combination === 1 &&
                                    <Block>
                                      {
                                        good.g_has_norm === 2 &&
                                        <Numbox
                                          num={cartGood.num}
                                          showNum={cartGood && cartGood.num !== 0}
                                          onReduce={this.this.setCart.bind(this, good, -1, cartGood)}
                                          onAdd={this.setCart.bind(this, good, 1)}
                                        />
                                      }
                                      {
                                        good.g_has_norm === 1 &&
                                        <IdButton onClick={this.openOptions.bind(this, good)}
                                                className={'theme-bg-' + theme}
                                        >选规格</IdButton>
                                      }
                                    </Block>
                                  }

                                  {
                                    good.g_combination === 2 &&
                                    <IdButton onClick={this.toStandardDetail.bind(this, good)}
                                            className={'theme-bg-' + theme}
                                    >选规格</IdButton>
                                  }
                                </View>   
                                {
                                  good.g_limit != 0 &&
                                  <Text className='red'>{limitText[good.g_limit - 1]}限购{good.g_limit_num}份</Text>
                                }
                              </View>
                            </View>
                          )
                        })
                      }

                    </View>
                  </View>
                ))
              }
            </ScrollView>
          </View>
        }

        {
          isShowCart && carts.length > 0 &&
          <Text className='mask' onClick={this.closeCart} onTouchMove={this.stopPropagation} />
        }
        <View
          onTouchMove={this.stopPropagation}
          className={classnames('cart', isShowCart && carts.length > 0 ? 'active' : '')}>
          <View className='cart-head'>
            <Image src={require('../../assets/images/icon-trash.png')}/>
            <Text onClick={this.askClearCart}>清空购物车</Text>
          </View>
          <ScrollView scrollY className='cart-list'>
            {
              carts.map((good, index) => (
                good.num && good.num !== 0 &&
                (
                  !good.optionalnumstr ?
                  <View className='item' key={index}>
                    <View class='item-left'>
                      <View className='name'>
                        {good.g_title}
                      </View>
                      <View className='param'>
                        {
                          good.property &&
                          good.property.map((prop, i) => (
                            <Text key={i}>
                              {prop.list_name[good.propertyTagIndex[i]]}
                              {i !== good.property.length - 1 ? '+' : ''}
                            </Text>
                          ))
                        }
                        {
                          good.property && good.property.length > 0 &&
                          good.optional && good.optional.length > 0 ? '+' : ''
                        }
                        {
                          good.optional &&
                          good.optional.map((opt, i) => (
                            <Text key={i}>
                              {opt.list[good.optionalTagIndex[i]].gn_name}
                              {i !== good.optional.length - 1 ? '+' : ''}
                            </Text>
                          ))
                        }
                      </View>
                    </View>
                    <View class='item-center'>
                      <View>
                        <Text className={'theme-c-' + theme}><Text class="yen">&yen;</Text>
                          <Text className='font-xin-normal'>
                            {
                              good._total.toFixed(2)
                            }
                          </Text>
                        </Text>
                        {
                          good.g_original_price && (good.g_original_price - 0) !== 0 && good.overNum == 0 &&
                          <Text className='pre-price'><Text class="yen">&yen;</Text>{good.g_original_price * good.num}</Text>
                        }
                      </View>
                      {
                        good.overNum > 0 && ((good.num - good.overNum) > 0) &&
                        <View class="over">(包含特价商品{good.num - good.overNum}份)</View>
                      }
                    </View>

                    <Numbox
                      num={good.num} showNum
                      onReduce={this.setCart.bind(this, good, -1, good)}
                      onAdd={this.setCart.bind(this, good, 1)}
                    />
                  </View>
                    :
                  <View className='item' key={index}>
                    <View class='item-left'>
                      <View className='name'>
                        {good.g_title}
                      </View>
                      <View className='param'>
                        {
                          good.fixed ?
                          good.fixed.reduce((total, fix) => {
                            total.push(`${fix.gn_name}(${fix.gn_num}份)`)

                            return total
                          }, []).join('+') : ''
                        }
                        {
                          good.fixed.length > 0 && good.optional.length > 0 ? '+' : ''
                        }
                        {
                          good.optional ?
                          good.optional.reduce((total, opt) => {

                            let str = opt.list.reduce((t, o) => {
                              o.num && (t.push(`${o.gn_name}(${o.num}份)`))
                              return t
                            }, [])

                            total.push(str.join('+'))

                            return total
                          }, []).join('+') : ''
                        }
                      </View>
                    </View>
                    <View class='item-center'>
                      <Text className={'theme-c-' + theme}><Text class="yen">&yen;</Text>
                        {
                          good._total.toFixed(2)
                        }
                      </Text>
                      {
                        good.g_original_price && (good.g_original_price - 0) !== 0 &&
                        <Text className='pre-price'><Text class="yen">&yen;</Text>{good.g_original_price * good.num}</Text>
                      }
                    </View>

                    <Numbox
                      num={good.num} showNum
                      onReduce={this.setComboCart.bind(this, good, -1)}
                      onAdd={this.setComboCart.bind(this, good, 1)}
                    />
                  </View>
                )
              ))
            }
          </ScrollView>

        </View>

        <Curtain show={isShowDetail} onCLose={this.closeDetail}>
          {
            curCart &&
            <View className='good-detail'>
              <View className='image-wrap'>
                <Image src={curGood.g_image_300}/>
              </View>
              <View className='info'>
                <View className='title'>
                  {
                    curGood.tag_name &&
                    <Text className={classnames('tag', 'theme-grad-bg-' + theme)}>{curGood.tag_name}</Text>
                  }
                  <Text className='name'>{curGood.g_title}</Text>
                </View>
                <View className='desc'>{curGood.g_description}</View>
                <View className='price-wrap'>
                  <View className={classnames('price', 'theme-c-' + theme)}>
                  <Text class="yen" style={{ fontSize: '21rpx' }}>&yen;</Text>
                    <Text className='font-xin-normal'>{curGood.g_price}</Text>
                  </View>
                  {
                    curGood.g_original_price * 1 !== 0 &&
                    <View className='pre-price font-xin-normal'><Text class="yen" style={{ fontSize: '21rpx' }}>&yen;</Text>{curGood.g_original_price}</View>
                  }
                  {
                    curGood.g_has_norm === 2 &&
                    (!curCart.num || curCart.num === 0) &&
                    <IdButton
                      className={'theme-grad-bg-' + theme} onClick={this.setLocalCart.bind(this, 1)}
                    >
                      加入购物车
                    </IdButton>
                  }
                  {
                    curGood.g_has_norm === 2 && curCart.num &&
                    curCart.num !== 0 &&
                    <Numbox
                      num={curCart.num}
                      showNum
                      onReduce={this.setLocalCart.bind(this, -1)}
                      onAdd={this.setLocalCart.bind(this, 1)}
                    />
                  }

                  {
                    curGood.g_combination === 1 && curGood.g_has_norm === 1 &&
                    <IdButton
                      className={'theme-grad-bg-' + theme} onClick={this.toChooseStan}
                    >
                      选规格
                    </IdButton>
                  }

                  {
                    curGood.g_combination === 2 &&
                    <IdButton
                      className={'theme-grad-bg-' + theme} onClick={this.toStandardDetail.bind(this, curGood)}
                    >
                      选规格
                    </IdButton>
                  }

                </View>
              </View>
            </View>
          }
        </Curtain>

        <Modal
          show={isShowOptions} title={curGood.g_title}
          blackTitle
          titleAlign='center' onHide={this.closeOptions.bind(this, curGood)}
        >
          <View className='option-modal-content'>
            <ScrollView scrollY>
              {
                stanInfo.norm.optional.map((item, index) => (
                  <View className='block' key={index}>
                    <View className='name'>{item.title}</View>
                    <View className='options'>
                      {
                        item.list.map((option, i) => (
                          <View
                            onClick={this.selectTag.bind(this, 'optionalTagIndex', index, i)} key={i}
                            className={optionalTagIndex[index] === i ? 'active theme-grad-bg-' + theme : ''}
                          >{option.gn_name}</View>
                        ))
                      }
                    </View>
                  </View>
                ))
              }
              {
                stanInfo.property.map((item, index) => (
                  <View className='block' key={index}>
                    <View className='name'>{item.name}</View>
                    <View className='options'>
                      {
                        item.list_name.map((option, i) => (
                          <View
                            onClick={this.selectTag.bind(this, 'propertyTagIndex', index, i)} key={i}
                            className={propertyTagIndex[index] === i ? 'active theme-grad-bg-' + theme : ''}
                          >{option}</View>
                        ))
                      }
                    </View>
                  </View>
                ))
              }
            </ScrollView>

            <View className='price-wrap'>
              <View className='price-box'>
                <View className={classnames('price', 'theme-c-' + theme)}>
                  <Text class="yen">&yen;</Text>
                  <Text className='font-xin-normal'>
                    {
                      (+curGood.g_price + (stanInfo.norm &&
                        stanInfo.norm.optional.reduce((total, item, index) => {
                          total += +item.list[optionalTagIndex[index]].gn_price
                          return total
                        }, 0))).toFixed(2)
                    }
                  </Text>
                </View>
                {
                  curGood.g_original_price * 1 !== 0 &&
                  <View className='pre-price'>
                    <Text class="yen">&yen;</Text>
                    {curGood.g_original_price}
                  </View>
                }
              </View>
              {
                (curCart.optionalstr !== (propertyTagIndex.join('') + optionalTagIndex.join('')) &&
                  !curCart.num || curCart.num === 0) ?
                <IdButton
                  className={'theme-grad-bg-' + theme} onClick={this.setLocalCart.bind(this, 1)}
                >
                  加入购物车
                </IdButton>
                  :
                  <Numbox
                    num={curCart.num} showNum
                    onReduce={this.setLocalCart.bind(this, -1)}
                    onAdd={this.setLocalCart.bind(this, 1)}
                  />
              }
            </View>
          </View>
        </Modal>

        <PayBox
          theme={theme} carts={carts} storeId={+this.$router.params.id}
          themeInfo={menu_cart}
          onPay={this.handlePay}
          onTop={this.handleTop}
          onOpenCart={this.ToggleShowCart}
          isShowCart={isShowCart}
        />

        {/*<ConfirmModal
          show={isShowCartWarn}
          className='clear-cart-modal'
          theme={theme}
          title=''
          onCancel={this.showOrHideCartWarn.bind(this, false)}
          onOk={this.clearCart}
        >
          清空购物车?
        </ConfirmModal>*/}

        <AtToast
          className='null-toast'
          isOpened={isGoodNull} hasMask
          text='部分原商品已下架，请重新挑选'/>

        {
          this.$router.params.isShare === '1' &&
          <BackToHome />
        }

      </ScrollView>

      :
      <Loading />
    )
  }
}

export default ShopIndex
