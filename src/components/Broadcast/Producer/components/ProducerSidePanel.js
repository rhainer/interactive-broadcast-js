// @flow
import React, { Component } from 'react';
import classNames from 'classnames';
import Icon from 'react-fontawesome';
import ActiveFanList from './ActiveFanList';
import FanSMSList from './FanSMSList';
import './ProducerSidePanel.css';

type Props = { hidden: boolean, broadcast: BroadcastState };
type SidePanelList = 'fans' | 'sms';

interface State {
  display: SidePanelList
}

class ProducerSidePanel extends Component {

  state: State;
  toggleList: SidePanelList => void;

  static iconStyles = {
    marginLeft: '7px',
    fontSize: '25px',
    color: 'blue',
    cursor: 'pointer'
  };

  constructor(props: Props) {
    super(props)
    this.state = { display: 'fans' }
    this.toggleList = this.toggleList.bind(this);
  }

  toggleList (display: SidePanelList): void {
    console.log(display);
    this.setState({ display })
  }

  render() {
    const toggle = this.toggleList;
    const { hidden, broadcast } = this.props;
    const { display } = this.state;
    const iconStyles = ProducerSidePanel.iconStyles;
    return (
      <div className={classNames('ProducerSidePanel', { hidden })} >
        <div className="ProducerSidePanel-header">
          <div className="indicator fans">
            { broadcast.activeFans.order.length }
            <Icon name="user" style={{...iconStyles, color: '#5e5e66'}} onClick={toggle.bind(this, 'fans')} />
          </div>
          <div className="indicator sms">
            { broadcast.fanSMS.length }
            <Icon name="envelope" style={{...iconStyles, color: '#f8cd21'}} onClick={toggle.bind(this, 'sms')} />
          </div>
        </div>
        <div>
          { display === 'sms' && <FanSMSList /> }
          { display === 'fans' && <ActiveFanList activeFans={broadcast.activeFans} /> }
        </div>
      </div>
    );
  }
}


export default ProducerSidePanel;
