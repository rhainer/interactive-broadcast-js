// @flow
import R from 'ramda';

const participantState = (stream?: Stream | null = null): ParticipantState => ({
  connected: !!stream,
  stream,
  networkQuality: null,
  video: !!R.prop('hasVideo', stream || {}),
  audio: !!R.prop('hasAudio', stream || {}),
  volume: 100,
});

const initialChatState = (fromType: ChatUser, fromId?: UserId, toType: ChatUser, to: UserWithConnection): ChatState => {
  const session: SessionName = R.contains('activeFan', [fromType, toType]) ? 'backstage' : 'stage';
  const chatId = R.equals(toType, 'activeFan') ? `activeFan-${R.prop('id', to)}` : toType;
  return {
    chatId,
    session,
    fromType,
    fromId,
    toType,
    to,
    displayed: true,
    minimized: false,
    messages: [],
  };
};

const initialState = (): BroadcastState => ({
  event: null,
  connected: false,
  backstageConnected: false,
  presenceConnected: false,
  publishOnlyEnabled: false,
  inPrivateCall: null,
  publishers: {
    camera: null,
  },
  subscribers: {
    camera: null,
  },
  meta: null,
  participants: {
    fan: participantState(),
    celebrity: participantState(),
    host: participantState(),
    backstageFan: participantState(),
  },
  activeFans: {
    map: {},
    order: [],
  },
  chats: {},
});

const activeFansUpdate = (activeFans: ActiveFans, update: ActiveFanMap): ActiveFans => {
  const currentOrder = R.prop('order', activeFans);
  const buildOrder = (): UserId[] => {
    const fanLeftLine = R.gt(R.length(currentOrder), R.length(R.keys(update)));
    if (R.isEmpty(currentOrder)) {
      return R.keys(update);
    }
    if (fanLeftLine) {
      return R.without(R.without(R.keys(update), currentOrder), currentOrder);
    }
    return R.concat(currentOrder, R.without(currentOrder, R.keys(update)));
  };

  return { map: R.defaultTo({})(update), order: buildOrder() };
};

// Reorder the active fans array
const updateFanOrder = (activeFans: ActiveFans, update: ActiveFanOrderUpdate): ActiveFans => {
  const { order } = activeFans;
  const { oldIndex, newIndex } = update;
  return R.insert(newIndex, order[oldIndex], R.remove(oldIndex, 1, order));
};

const broadcast = (state: BroadcastState = initialState(), action: BroadcastAction): BroadcastState => {
  switch (action.type) {
    case 'SET_PUBLISH_ONLY_ENABLED':
      return R.assoc('publishOnlyEnabled', action.publishOnlyEnabled, state);
    case 'BROADCAST_PARTICIPANT_JOINED':
      return R.assocPath(['participants', action.participantType], participantState(action.stream), state);
    case 'BROADCAST_PARTICIPANT_LEFT':
      return R.assocPath(['participants', action.participantType], participantState(), state);
    case 'PARTICIPANT_PROPERTY_CHANGED':
      return R.assocPath(['participants', action.participantType, action.update.property], action.update.value, state);
    case 'SET_BROADCAST_STATE':
      return R.merge(action.state, state);
    case 'SET_BROADCAST_EVENT':
      return R.assoc('event', action.event, state);
    case 'SET_BROADCAST_EVENT_STATUS':
      return R.assoc('event', R.assoc('status', action.status, state.event), state);
    case 'BROADCAST_CONNECTED':
      return R.assoc('connected', action.connected, state);
    case 'BACKSTAGE_CONNECTED':
      return R.assoc('backstageConnected', action.connected, state);
    case 'BROADCAST_PRESENCE_CONNECTED':
      return R.assoc('presenceConnected', action.connected, state);
    case 'START_PRIVATE_CALL':
      return R.assoc('inPrivateCall', action.participant, state);
    case 'END_PRIVATE_CALL':
      return R.assoc('inPrivateCall', null, state);
    case 'RESET_BROADCAST_EVENT':
      return initialState();
    case 'UPDATE_ACTIVE_FANS':
      return R.assoc('activeFans', activeFansUpdate(state.activeFans, action.update), state);
    case 'REORDER_BROADCAST_ACTIVE_FANS':
      return R.assocPath(['activeFans', 'order'], updateFanOrder(state.activeFans, action.update), state);
    case 'START_NEW_FAN_CHAT':
      return R.assocPath(['chats', `activeFan-${action.fan.id}`], initialChatState('producer', undefined, 'activeFan', action.fan), state);
    case 'START_NEW_PRODUCER_CHAT':
      return R.assocPath(['chats', 'producer'], initialChatState(action.fromType, action.fromId, 'producer', action.producer), state);
    case 'DISPLAY_CHAT':
      return R.assocPath(['chats', action.chatId, 'displayed'], action.display, state);
    case 'NEW_CHAT_MESSAGE':
      return R.assocPath(['chats', action.chatId, 'messages'], R.append(action.message, R.path(['chats', action.chatId, 'messages'], state)), state);
    default:
      return state;
  }
};


export default broadcast;
