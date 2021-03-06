import Taro, { Component } from '@tarojs/taro'
import { Form, Button } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import '../../app.less'

@connect(() => ({}))
class IdButton extends Component {

  handleSubmit = e => {
    this.props.dispatch({
      type: 'common/postFormId',
      payload: {
        formid: e.detail.formId
      }
    })
  }

  render () {
    const {onClick, disabled, className, showMust} = this.props

    return (
      <Form onSubmit={this.handleSubmit} reportSubmit='true'>
        <Button
          onClick={onClick}
          disabled={disabled}
          style={showMust ? {fontSize: '26rpx', background: '#999 !important'} : ''}
          formType='submit'
          className={className}
        >
          {this.props.children}</Button>
      </Form>
    )
  }
}

export default IdButton
