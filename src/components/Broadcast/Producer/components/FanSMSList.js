// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import CopyToClipboard from '../../../Common/CopyToClipboard';
import './FanSMSList.css';

interface Props {
  messages: string[]
}


class FanSMSList extends Component {
  constructor(props: Props) {
    super(props)
  }

  render() {
    const messages = this.props.messages;
    const smsClass = i => classNames("sms", i % 2 === 0 ? 'even' : 'odd');
    return (
      <div className="FanSMSList">
        <ul className="sms-list">
        { messages.map((m, idx) =>
          <CopyToClipboard key={`${idx}${m}`}text={`Fan SMS: ${m}`} onCopyText="Fan Message">
            <li key={idx} className={ smsClass(idx)}> { m } </li>
          </CopyToClipboard>
          )
        }
        </ul>
      </div>
    );
  }
}

const mapStateToProps = (state: State): Props => ({
  messages: state.broadcast.fanSMS,
});

export default connect(mapStateToProps)(FanSMSList);