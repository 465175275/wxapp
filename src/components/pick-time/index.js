import Taro, {Component} from '@tarojs/taro'
import {View, Block, Text, ScrollView} from '@tarojs/components'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import './index.less'
import '../../app.less'

class PickTime extends Component {

  static propTypes = {
    show: PropTypes.bool,
    onClose: PropTypes.func
  }

  static defaultProps = {
    show: false,
    onClose: null,
    reserveTime: []
  }

  state = {
    _dayIndex: null,
    timeViewId: null
  }

  componentDidMount () {
    this.setState({_dayIndex: 0})
  }

  chooseDay = index => {
    this.setState({_dayIndex: index})
    if (index === this.props.dayIndex) {
      this.setState({
        timeViewId: 'time-' + this.props.timeIndex
      })
    } else {
      this.setState({
        timeViewId: 'time-' + 'null'
      }, () => {
        this.setState({
          timeViewId: 'time-' + 0
        })
      })
    }
  }

  chooseTime = index => {
    this.props.onChangeTime(this.state._dayIndex, index)
    this.setState({timeViewId: null})
  }

  handleClose = () => {
    this.props.onClose()
    this.setState({
      _dayIndex: this.props.dayIndex,
      timeViewId: null
    })
  }

  stopPro = e => {
    e.stopPropagation()
  }

  render() {
    const {show, reserveTime, theme, showPrice, timeIndex, isIphoneX} = this.props
    const {_dayIndex, timeViewId} = this.state
    const realDay = _dayIndex === null ? (this.props.dayIndex || 0) : _dayIndex

    return (
      <Block>
        <View
          className='mask' style={{display: show ? 'block' : 'none'}}
          onClick={this.handleClose} onTouchMove={this.stopPro}
        />
        <View className={classnames('pick-time', show ? 'active' : '')} onTouchMove={this.stopPro}>
          <View className='title'>选择预约时间
            <Text className='cacel' onClick={this.handleClose}>取消</Text>
          </View>
          {
            show &&
            <View className={classnames('picker', isIphoneX ? 'iphonex' : '')}>
              <ScrollView scrollY className='day-list' scrollIntoView={'day-' + realDay}>
                {
                  reserveTime.map((day, index) => (
                    <View
                      className={classnames('day-item',
                        realDay === index ? 'active theme-c-' + theme : '')}
                      key={index}
                      id={'day-' + index}
                      onClick={this.chooseDay.bind(this, index)}
                    >{day.title}</View>
                  ))
                }
              </ScrollView>
              <ScrollView scrollY className='time-list' scrollIntoView={timeViewId || 'time-' + timeIndex}>
                {
                  reserveTime.length > 0 && reserveTime[realDay].time.length > 0 &&
                  reserveTime[realDay].time.map((time, index) => (
                    <View
                      className={classnames('time-item', (realDay === null || realDay === this.props.dayIndex) && timeIndex === index ? 'active theme-c-' + theme : '')}
                      key={index}
                      id={'time-' + index}
                      onClick={this.chooseTime.bind(this, index)}
                    >
                      <Text className='time'>
                        {
                          realDay === 0 && index === 0 &&
                          <Text>现在下单，</Text>
                        }
                        {
                          realDay === 0 && index === 0 ? '预计' : ''
                        }
                        {time.time}
                      </Text>
                      {
                        showPrice &&
                        <Text className='price'>
                          {time.price}元配送费
                        </Text>
                      }
                    </View>
                  ))
                }
              </ScrollView>
            </View>
          }
        </View>
      </Block>
    )
  }
}

export default PickTime
