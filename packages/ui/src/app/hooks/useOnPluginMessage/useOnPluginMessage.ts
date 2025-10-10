import { MessageToUIPayload } from '@eggstractor/common';
import { useEffect } from 'react';

// Utility: given a type string, get the narrowed payload
type MsgFor<TType extends MessageToUIPayload['type']> = Extract<
  MessageToUIPayload,
  { type: TType }
>;

/**
 * Hook to listen for a specific `pluginMessage.type` and run a callback when it arrives.
 *
 * @param type The `pluginMessage.type` you want to listen for
 * @param callback A function invoked with the narrowed payload
 */
export function useOnPluginMessage<TType extends MessageToUIPayload['type']>(
  type: TType,
  callback: (msg: MsgFor<TType>) => void,
) {
  useEffect(() => {
    const listener = (event: MessageEvent<{ pluginMessage: MessageToUIPayload }>) => {
      const payload = event?.data?.pluginMessage;
      if (payload && payload.type === type) {
        callback(payload as MsgFor<TType>);
      }
    };

    window.addEventListener('message', listener);
    return () => {
      window.removeEventListener('message', listener);
    };
  }, [type, callback]);
}
