import Taro, { Component } from '@tarojs/taro'
import { View, Button, Text, Image, Swiper, SwiperItem } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { AtIcon } from 'taro-ui'
import classnames from 'classnames'

import { themeBtnShadowColors, warningDistance } from '../../config'
import Modal from '../../components/modal'
import CouponModal from '../../components/coupon-modal'
import Loading from '../../components/Loading'
import './index.less'


@connect(({common}) => ({...common}))
class Index extends Component {

  config = {
    navigationBarTitleText: '首页',
    enablePullDownRefresh: true
  }

  state = {
    activeBannerIndex: 0,
    user_full_num: 8,
    full_num: 8,
    isShowModal: false,
    home_banner: [],
    full_logo: '',
    full_logo_no: '',
    full_image: '',
    full_undefind: '',
    full_status: '',
    home_button: {},
    norm: [],
    isShowCoupon: false,
    curCoupon: {},
  }

  componentDidMount () {
    Taro.showShareMenu({
      withShareTicket: true
    })
    if (this.$router.params.push_id) {
      this.props.dispatch({
        type: 'common/updateAiPush',
        payload: {
          push_id: this.$router.params.push_id
        }
      })
    }
  }

  componentWillMount () {
    const { id } = wx.getLaunchOptionsSync().query
    if(id) {
      let time = setInterval(() => {
        const { latitude, longitude } = this.props.localInfo
        if(latitude && longitude) {
          clearTimeout(time)
          Taro.navigateTo({
            url: `/pages/shop-index/index?id=${id}`
          })
        }
      }, 500)
    }
  }

  componentDidShow () {
    const { localInfo } = this.props
    this.getIndexInfo();

    this.props.localInfo.error === 1 && this.props.localInfo.err.errCode == 0
    && this.props.localInfo.err.errMsg.indexOf('auth') > -1 &&
    Taro.reLaunch({
      url: '/pages/auth-setting/index'
    })

  }

  componentDidHide () { }

  onPullDownRefresh () {
    Taro.stopPullDownRefresh()
    this.props.dispatch({
      type: 'common/initRequest'
    })
    this.getIndexInfo()
  }

  getIndexInfo = () => {
    this.props.dispatch({
      type: 'common/requestHomeInfo',
      payload: {
        type: 1
      }
    }).then(res => {

      if (res.under_review) {
        Taro.redirectTo({
          url: '/pages/alias/index'
        })
        return
      }

      this.setState({
        ...res
      })

      this.coupon = res.coupon
      this.curCouponIndex = 0

      if (res.coupon.length > 0) {
        setTimeout(() => {
          this.setState({
            isShowCoupon: true,
            curCoupon: res.coupon[0],
          })
        }, 500)
      }
    })
  }

  showOrHideModal = (bool) => {
    this.setState({isShowModal: bool})
  }

  toChoosePage = (present) => {
    if (!this.props.userInfo.userInfo) return
    if(this.state.store_id) {
      const { s_address_lat = 0, s_address_lng = 0, store_id } = this.state
      const { latitude = 0, longitude = 0 } = this.props.localInfo
      let distance = this.GetDistance(latitude, longitude, s_address_lat, s_address_lng)
      if(distance * 1000 > warningDistance) {
        Taro.showModal({
          title: '提示',
          content: `我这好像离你有点儿远，还继续点吗(${distance}km)`
        }).then(({confirm}) => {
          if (!confirm) return
          Taro.navigateTo({
            url: (present ? '/pages/present-good/index?id=' : '/pages/shop-index/index?id=') + store_id
          })
        })
      }else {
        Taro.navigateTo({
          url: (present ? '/pages/present-good/index?id=' : '/pages/shop-index/index?id=') + store_id
        })
      }
    }else {
      const url = present ? '/pages/choose-shop/index?type=' + present : '/pages/choose-shop/index'
      Taro.navigateTo({
        url
      })
    }
  }



  
  GetDistance = ( lat1,  lng1,  lat2,  lng2) => {
    let radLat1 = lat1*Math.PI / 180.0;
    let radLat2 = lat2*Math.PI / 180.0;
    let a = radLat1 - radLat2;
    let b = lng1*Math.PI / 180.0 - lng2*Math.PI / 180.0;
    let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a/2),2) +
    Math.cos(radLat1)*Math.cos(radLat2)*Math.pow(Math.sin(b/2),2)));
    s = s *6378.137 ;// EARTH_RADIUS;
    s = Math.round(s * 10000) / 10000;
    return s;
  }

  toNoticePage = () => {
    Taro.navigateTo({
      url: '/pages/notice/index'
    })
  }

  toOrderListPage = () => {
    Taro.navigateTo({
      url: '/pages/order-list/index'
    })
  }

  toCouponPage = () => {
    Taro.navigateTo({
      url: '/pages/coupon/index'
    })
  }

  getedUserInfo = (res) => {
    if (this.props.userInfo.userInfo) return

    this.handleFetchUserInfo(res)

    this.toChoosePage()
  }

  presentInfo = res => {
    if (this.props.userInfo.userInfo) return

    this.handleFetchUserInfo(res)

    this.toChoosePage('present')
  }

  handleFetchUserInfo = (res) => {
    this.props.dispatch({
      type: 'common/setUserInfo',
      payload: res.detail
    })
    const { encryptedData = '', iv = '' } = res.detail

    this.props.dispatch({
      type: 'common/postUserInfo',
      payload: {
        encryptedData, iv
      }
    })
  }

  handleBannerChange = e => {
    this.setState({activeBannerIndex: e.detail.current})
  }

  couponClose = () => {
    const {curCouponIndex, coupon} = this

    this.setState({
      isShowCoupon: false
    })

    if (curCouponIndex + 2 <= coupon.length) {
      this.curCouponIndex  ++
      setTimeout(() => {
        this.setState({
          isShowCoupon: true,
          curCoupon: coupon[this.curCouponIndex],
        })
      }, 350)
    }
  }

  calcHourZone = () => {
    let hour = new Date().getHours()

    if (hour >=3 && hour < 6) {
      return '黎明将至，准备迎接日出了吗？';
    } else if (hour > 6 && hour < 9) {
      return '早安，又是美好的一天!';
    } else if (hour >= 9 && hour < 12) {
      return '上午好，今天也要加油呀！';
    } else if (hour >= 12 && hour < 15) {
      return '中午好，越努力越幸运哟！';
    } else if (hour >= 15 && hour < 18) {
      return '下午茶时间到啦！';
    } else if (hour >= 18 && hour < 21) {
      return '今天你很棒棒哟！';
    } else if (hour >=21 || hour < 3) {
      return '夜里夜深了，今晚月色真美！'
    }
  }

  render () {
    const {theme, userInfo} = this.props

    const { user_full_num, full_num, isShowModal, activeBannerIndex,
      home_banner, full_image, full_logo, full_logo_no, home_button,
      full_status, full_undefind, norm, isShowCoupon,
      curCoupon} = this.state

    const totStarsArr = new Array(full_num);

    const isIphoneX = !!(this.props.systemInfo.model &&
      this.props.systemInfo.model.replace(' ', '').toLowerCase().indexOf('iphonex') > -1)

    return (
      home_banner && home_banner.banner ?
      <View className='index-page' style={{display: home_banner.banner ? 'block' : 'none'}}>
        <View className={classnames('icon-help-wrap', 'theme-c-' + theme)} onClick={this.toNoticePage}>
          <Text className='greed'>{this.calcHourZone()}</Text>
          <AtIcon value='help' size='14' />
        </View>

        <View className='banner'>
          <Swiper
            circular autoplay={home_banner.auto_play != 0} onChange={this.handleBannerChange}
            interval={home_banner.auto_play * 1000}
          >
            {
              home_banner.banner && home_banner.banner.filter(item => !!item.image).map((img, index) => (
                <SwiperItem className='swiper-item' key={index}>
                  <View>
                    <Image className='swiper-img' src={img.image} />
                  </View>
                </SwiperItem>
              ))
            }

          </Swiper>
        </View>
        <View className='banner-dot'>
          {
            home_banner.banner && home_banner.banner.filter(item => !!item.image).map((img, index) => (
              <Text className={index == activeBannerIndex ? 'active theme-bg-' + theme : ''} key={index} />
            ))
          }
        </View>
        <Button
          className={classnames('do-btn', 'theme-grad-bg-' + theme)}
          style={{boxShadow: '0 40rpx 40rpx -30rpx ' + themeBtnShadowColors[theme]}}
          openType={userInfo.userInfo ? '' : 'getUserInfo'}
          onGetUserInfo={this.getedUserInfo}
          formType='submit'
          onClick={this.toChoosePage.bind(this, null)}
        >
          开始点餐</Button>

        <View className={classnames('icon-box clearfix', 'theme-c-' + theme, isIphoneX ? 'iphonex' : '')}>
          <View onClick={this.toOrderListPage}>
            <View>
              <Image src={home_button.order_image} />
              <Text>订单</Text>
            </View>
          </View>
          <View className='line'><View /></View>
          <View onClick={this.toCouponPage}>
            <View>
              <Image src={home_button.coupon_image} />
              <Text>优惠券</Text>
            </View>
          </View>
        </View>

        {
          full_status === 1 &&
          <View className='tips'>
            <View className='info'>
              <View className='title'>满单即送</View>
              <View className='count-box'>
                <View className={classnames('count', 'theme-c-' + theme)}>
                  <Text className='font-xin-normal'>{user_full_num}/{full_num}</Text>单
                </View>

                <Button
                  class={classnames('do', 'theme-grad-bg-' + theme)}
                  style={{display: (user_full_num >= full_num && full_num !== 0) ? 'block' : 'none'}}
                  openType={userInfo.userInfo ? '' : 'getUserInfo'}
                  onGetUserInfo={this.presentInfo}
                  formType='submit'
                  onClick={this.toChoosePage.bind(this, 'present')}
                >
                  去领取
                </Button>
              </View>
              <View className='star-box'>
                {
                  totStarsArr.map((item, index) => (
                    <Image mode='widthFix'
                      className={full_num === 3 ? 'big' : ''}
                      src={(user_full_num >= index + 1) ? full_logo : full_logo_no} key={index}
                    />
                  ))
                }
              </View>
              <View className='rule' onClick={this.showOrHideModal.bind(this, true)}>活动规则
                <AtIcon value='chevron-right' size='17' />
              </View>
            </View>
            <Image src={full_image} />
          </View>
        }

        {
          full_status === 2 &&
          <Image src={full_undefind} className='full-image' />
        }

        <Modal title='活动规则'
          show={isShowModal} onHide={this.showOrHideModal.bind(this, false)}>
          <View className='rule-text'>
            {
              norm.map((item, index) => (
                <View key={index}>{index + 1}. {item}</View>
              ))
            }
          </View>
        </Modal>

        <CouponModal
          show={isShowCoupon} coupon={curCoupon}
          onClose={this.couponClose}
        />

      </View>
        :
        <Loading />
    )
  }
}

export default Index
