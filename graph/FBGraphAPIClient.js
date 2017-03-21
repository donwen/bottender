/* @flow */
import axios from 'axios';
import invariant from 'invariant';

import type Axios from './types.flow';

type AttachmentPayload = {
  url?: string,
};

type Attachment = {
  type: string,
  payload: AttachmentPayload,
};

type Message = {
  text?: ?string,
  attachment?: ?Attachment,
};

type TemplateButton = {
  type: string,
  title: string,
  url?: string,
  payload?: string,
};

type MenuItem = TemplateButton;

type TemplateElement = {
  title: string,
  image_url: string,
  subtitle: string,
  default_action: {
    type: string,
    url: string,
    messenger_extensions: boolean,
    webview_height_ratio: string,
    fallback_url: string,
  },
  buttons: Array<TemplateButton>,
};

type Address = {
  street_1: string,
  street_2?: ?string,
  city: string,
  postal_code: string,
  state: string,
  country: string,
};

type Summary = {
  subtotal?: ?number,
  shipping_cost?: ?number,
  total_tax?: ?number,
  total_cost: number,
};

type Adjustment = {
  name?: ?string,
  ammont?: ?number,
};

type ReceiptAttributes = {
  recipient_name: string,
  merchant_name?: ?string,
  order_number: string, // must be unique
  currency: string,
  payment_method: string,
  timestamp?: ?string,
  order_url?: ?string,
  elements?: ?Array<TemplateElement>,
  address?: ?Address,
  summary: Summary,
  adjustments?: ?Array<Adjustment>,
};

type QuickReply = {
  content_type: string,
  title?: string,
  payload?: string,
  image_url: string,
};

type SenderAction = string;

type User = {
  first_name: string,
  last_name: string,
  profile_pic: string,
  locale: string,
  timezone: number,
  gender: string,
};

type MessengerProfileResponse = {
  data: Array<{
    get_started?: {
      payload: string,
    },
    persistent_menu?: Array<{
      locale: string,
      composer_input_disabled: boolean,
      call_to_actions: Array<TemplateButton>,
    }>,
    greeting?: Array<{
      locale: string,
      text: string,
    }>,
    whitelisted_domains?: Array<string>,
  }>,
};

type MutationSuccessResponse = {
  result: string,
};

type SendMessageSucessResponse = {
  recipient_id: string,
  message_id: string,
};

type SendSenderActionResponse = {
  recipient_id: string,
};

export default class FBGraphAPIClient {
  static factory = (accessToken: string): FBGraphAPIClient =>
    new FBGraphAPIClient(accessToken);

  _accessToken: string;
  _http: Axios;

  constructor(accessToken: string) {
    this._accessToken = accessToken;
    this._http = axios.create({
      baseURL: 'https://graph.facebook.com/v2.8/',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  getHTTPClient: () => Axios = () => this._http;

  /**
   * Get User Profile
   *
   * https://www.quora.com/How-connect-Facebook-user-id-to-sender-id-in-the-Facebook-messenger-platform
   * first_name, last_name, profile_pic, locale, timezone, gender
   */
  getUserProfile = (userId: string): Promise<User> =>
    this._http.get(`/${userId}?access_token=${this._accessToken}`);

  /**
   * Get Started Button
   *
   * https://developers.facebook.com/docs/messenger-platform/messenger-profile/get-started-button
   */
  getGetStartedButton = (): Promise<MessengerProfileResponse> =>
    this._http.get(
      `/me/messenger_profile?fields=get_started&access_token=${this._accessToken}`,
    );

  setGetStartedButton = (payload: string): Promise<MutationSuccessResponse> =>
    this._http.post(`/me/messenger_profile?access_token=${this._accessToken}`, {
      get_started: {
        payload,
      },
    });

  deleteGetStartedButton = (): Promise<MutationSuccessResponse> =>
    this._http.delete(
      `/me/messenger_profile?access_token=${this._accessToken}`,
      {
        data: {
          fields: ['get_started'],
        },
      },
    );

  /**
   * Persistent Menu
   *
   * https://developers.facebook.com/docs/messenger-platform/messenger-profile/persistent-menu
   * TODO: support locale?
   */
  getPersistentMenu = (): Promise<MessengerProfileResponse> =>
    this._http.get(
      `/me/messenger_profile?fields=persistent_menu&access_token=${this._accessToken}`,
    );

  setPersistentMenu = (
    menuItems: Array<MenuItem>,
    { inputDisabled = false }: { inputDisabled: boolean } = {},
  ): Promise<MutationSuccessResponse> =>
    this._http.post(`/me/messenger_profile?access_token=${this._accessToken}`, {
      persistent_menu: [
        {
          locale: 'default',
          composer_input_disabled: inputDisabled,
          call_to_actions: menuItems,
        },
      ],
    });

  deletePersistentMenu = (): Promise<MutationSuccessResponse> =>
    this._http.delete(
      `/me/messenger_profile?access_token=${this._accessToken}`,
      {
        data: {
          fields: ['persistent_menu'],
        },
      },
    );

  /**
   * Greeting Text
   *
   * https://developers.facebook.com/docs/messenger-platform/messenger-profile/greeting-text
   * TODO: support locale?
   */
  getGreetingText = (): Promise<MessengerProfileResponse> =>
    this._http.get(
      `/me/messenger_profile?fields=greeting&access_token=${this._accessToken}`,
    );

  setGreetingText = (text: string): Promise<MutationSuccessResponse> =>
    this._http.post(`/me/messenger_profile?access_token=${this._accessToken}`, {
      greeting: [
        {
          locale: 'default',
          text,
        },
      ],
    });

  deleteGreetingText = (): Promise<MutationSuccessResponse> =>
    this._http.delete(
      `/me/messenger_profile?access_token=${this._accessToken}`,
      {
        data: {
          fields: ['greeting'],
        },
      },
    );

  /**
   * Domain Whitelist
   *
   * https://developers.facebook.com/docs/messenger-platform/messenger-profile/domain-whitelisting
   */
  getDomainWhitelist = (): Promise<MessengerProfileResponse> =>
    this._http.get(
      `/me/messenger_profile?fields=whitelisted_domains&access_token=${this._accessToken}`,
    );

  setDomainWhitelist = (domain: string): Promise<MutationSuccessResponse> =>
    this._http.post(`/me/messenger_profile?access_token=${this._accessToken}`, {
      whitelisted_domains: [domain],
    });

  deleteDomainWhitelist = (): Promise<MutationSuccessResponse> =>
    this._http.delete(
      `/me/messenger_profile?access_token=${this._accessToken}`,
      {
        data: {
          fields: ['whitelisted_domains'],
        },
      },
    );

  /**
   * Account Linking URL
   *
   * https://developers.facebook.com/docs/messenger-platform/messenger-profile/account-linking-url
   */
  getAccountLinkingURL = (): Promise<MessengerProfileResponse> =>
    this._http.get(
      `/me/messenger_profile?fields=account_linking_url&access_token=${this._accessToken}`,
    );

  setAccountLinkingURL = (url: string): Promise<MutationSuccessResponse> =>
    this._http.post(`/me/messenger_profile?access_token=${this._accessToken}`, {
      account_linking_url: url,
    });

  deleteAccountLinkingURL = (): Promise<MutationSuccessResponse> =>
    this._http.delete(
      `/me/messenger_profile?access_token=${this._accessToken}`,
      {
        data: {
          fields: ['account_linking_url'],
        },
      },
    );

  /**
   * Payment Settings
   *
   * https://developers.facebook.com/docs/messenger-platform/messenger-profile/payment-settings
   */
  getPaymentSettings = (): Promise<MessengerProfileResponse> =>
    this._http.get(
      `/me/messenger_profile?fields=payment_settings&access_token=${this._accessToken}`,
    );

  setPaymentPrivacyPolicyURL = (
    url: string,
  ): Promise<MutationSuccessResponse> =>
    this._http.post(`/me/messenger_profile?access_token=${this._accessToken}`, {
      payment_settings: {
        privacy_url: url,
      },
    });

  setPaymentPublicKey = (key: string): Promise<MutationSuccessResponse> =>
    this._http.post(`/me/messenger_profile?access_token=${this._accessToken}`, {
      payment_settings: {
        public_key: key,
      },
    });

  setPaymentTestUsers = (
    users: Array<string>,
  ): Promise<MutationSuccessResponse> =>
    this._http.post(`/me/messenger_profile?access_token=${this._accessToken}`, {
      payment_settings: {
        test_users: users,
      },
    });

  deletePaymentSettings = (): Promise<MutationSuccessResponse> =>
    this._http.delete(
      `/me/messenger_profile?access_token=${this._accessToken}`,
      {
        data: {
          fields: ['payment_settings'],
        },
      },
    );

  /**
   * Target Audience
   *
   * https://developers.facebook.com/docs/messenger-platform/messenger-profile/target-audience
   */
  getTargetAudience = (): Promise<MessengerProfileResponse> =>
    this._http.get(
      `/me/messenger_profile?fields=target_audience&access_token=${this._accessToken}`,
    );

  setTargetAudience = (
    type: string,
    whitelist: ?Array<string> = [],
    blacklist: ?Array<string> = [],
  ): Promise<MutationSuccessResponse> =>
    this._http.post(`/me/messenger_profile?access_token=${this._accessToken}`, {
      target_audience: {
        audience_type: type,
        countries: {
          whitelist,
          blacklist,
        },
      },
    });

  deleteTargetAudience = (): Promise<MutationSuccessResponse> =>
    this._http.delete(
      `/me/messenger_profile?access_token=${this._accessToken}`,
      {
        data: {
          fields: ['target_audience'],
        },
      },
    );

  /**
   * Send API
   *
   * https://developers.facebook.com/docs/messenger-platform/send-api-reference
   */
  send = (
    recipientId: string,
    message: Message,
  ): Promise<SendMessageSucessResponse> =>
    this._http.post(`/me/messages?access_token=${this._accessToken}`, {
      recipient: {
        id: recipientId,
      },
      message,
    });

  /**
   * Content Types
   *
   * https://developers.facebook.com/docs/messenger-platform/send-api-reference/contenttypes
   */
  sendAttachment = (
    recipientId: string,
    attachment: Attachment,
  ): Promise<SendMessageSucessResponse> =>
    this.send(recipientId, { attachment });

  sendText = (
    recipientId: string,
    text: string,
  ): Promise<SendMessageSucessResponse> => this.send(recipientId, { text });

  // TODO: support formdata fileupload?
  // FIXME: prettier bug?
  sendAudio = (
    recipientId: string,
    url: string,
  ): Promise<SendMessageSucessResponse> =>
    this.sendAttachment(recipientId, {
      type: 'audio', // eslint-disable-line
      payload: {
        url,
      },
    });

  // TODO: support formdata fileupload?
  sendImage = (
    recipientId: string,
    url: string,
  ): Promise<SendMessageSucessResponse> =>
    this.sendAttachment(recipientId, {
      type: 'image',
      payload: {
        url,
      },
    });

  // TODO: support formdata fileupload?
  sendVideo = (
    recipientId: string,
    url: string,
  ): Promise<SendMessageSucessResponse> =>
    this.sendAttachment(recipientId, {
      type: 'video',
      payload: {
        url,
      },
    });

  // TODO: support formdata fileupload?
  sendFile = (
    recipientId: string,
    url: string,
  ): Promise<SendMessageSucessResponse> =>
    this.sendAttachment(recipientId, {
      type: 'file',
      payload: {
        url,
      },
    });

  /**
   * Templates
   *
   * https://developers.facebook.com/docs/messenger-platform/send-api-reference/templates
   */
  sendTemplate = (
    recipientId: string,
    payload: AttachmentPayload,
  ): Promise<SendMessageSucessResponse> =>
    this.sendAttachment(recipientId, {
      type: 'template',
      payload,
    });

  // https://developers.facebook.com/docs/messenger-platform/send-api-reference/button-template
  sendButtonTemplate = (
    recipientId: string,
    text: string,
    buttons: Array<TemplateButton>,
  ): Promise<SendMessageSucessResponse> =>
    this.sendTemplate(recipientId, {
      template_type: 'button',
      text,
      buttons,
    });

  // https://developers.facebook.com/docs/messenger-platform/send-api-reference/generic-template
  sendGenericTemplate = (
    recipientId: string,
    elements: Array<TemplateElement>,
    ratio: string = 'square',
  ): Promise<SendMessageSucessResponse> =>
    this.sendTemplate(recipientId, {
      template_type: 'generic',
      elements,
      image_aspect_ratio: ratio,
    });

  // https://developers.facebook.com/docs/messenger-platform/send-api-reference/list-template
  sendListTemplate = (
    recipientId: string,
    elements: Array<TemplateElement>,
    buttons: Array<TemplateButton>,
    topElementStyle: string = 'large',
  ): Promise<SendMessageSucessResponse> =>
    this.sendTemplate(recipientId, {
      template_type: 'list',
      elements,
      buttons,
      top_element_style: topElementStyle,
    });

  // https://developers.facebook.com/docs/messenger-platform/send-api-reference/receipt-template
  sendReceiptTemplate = (
    recipientId: string,
    receipt: ReceiptAttributes,
  ): Promise<SendMessageSucessResponse> =>
    this.sendTemplate(recipientId, {
      template_type: 'receipt',
      ...receipt,
    });

  /**
   * Quick Replies
   *
   * https://developers.facebook.com/docs/messenger-platform/send-api-reference/quick-replies
   */
  sendQuickReplies = (
    recipientId: string,
    text: ?string,
    attachment: ?Attachment,
    quickReplies: Array<QuickReply>,
  ): Promise<SendMessageSucessResponse> => {
    // quick_replies is limited to 11
    invariant(
      Array.isArray(quickReplies) && quickReplies.length <= 11,
      'quickReplies is an array and limited to 11',
    );

    quickReplies.forEach(quickReply => {
      if (quickReplies.content_type === 'text') {
        // title has a 20 character limit, after that it gets truncated
        invariant(
          (quickReply.title: any).trim().length <= 20,
          'title of quickReply has a 20 character limit, after that it gets truncated',
        );

        // payload has a 1000 character limit
        invariant(
          (quickReply.payload: any).length <= 1000,
          'payload of quickReply has a 1000 character limit',
        );
      }
    });

    return this.send(recipientId, {
      text,
      attachment,
      quick_replies: quickReplies,
    });
  };

  /**
   * Typing
   *
   * https://developers.facebook.com/docs/messenger-platform/send-api-reference/sender-actions
   */
  sendSenderAction = (
    recipientId: string,
    action: SenderAction,
  ): Promise<SendSenderActionResponse> =>
    this._http.post(`/me/messages?access_token=${this._accessToken}`, {
      recipient: {
        id: recipientId,
      },
      sender_action: action,
    });

  turnTypingIndicatorsOn = (
    recipientId: string,
  ): Promise<SendSenderActionResponse> =>
    this.sendSenderAction(recipientId, 'typing_on');

  turnTypingIndicatorsOff = (
    recipientId: string,
  ): Promise<SendSenderActionResponse> =>
    this.sendSenderAction(recipientId, 'typing_off');

  /**
   * Upload API
   *
   * https://developers.facebook.com/docs/messenger-platform/send-api-reference/attachment-upload/v2.8
   */
  uploadAttachment = (type: string, url: string) =>
    this._http.post(
      `/me/message_attachments?access_token=${this._accessToken}`,
      {
        message: {
          attachment: {
            type,
            payload: {
              url,
              is_reusable: true,
            },
          },
        },
      },
    );

  uploadAudio = (url: string) => this.uploadAttachment('audio', url);
  uploadImage = (url: string) => this.uploadAttachment('image', url);
  uploadVideo = (url: string) => this.uploadAttachment('video', url);
  uploadFile = (url: string) => this.uploadAttachment('file', url);
}