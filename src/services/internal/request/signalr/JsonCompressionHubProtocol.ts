import {
  CompletionMessage,
  HubMessage,
  IHubProtocol,
  InvocationMessage,
  MessageType,
  StreamItemMessage
} from '@microsoft/signalr/src/IHubProtocol'
import { ILogger, LogLevel } from '@microsoft/signalr/src/ILogger'
import { TransferFormat } from '@microsoft/signalr/src/ITransport'
import { NullLogger } from '@microsoft/signalr/src/Loggers'
import { TextMessageFormat } from '@microsoft/signalr/src/TextMessageFormat'
import { BinaryMessageFormat } from '@microsoft/signalr-protocol-msgpack/src/BinaryMessageFormat'
import { gzip } from 'pako'
import { Buffer } from 'buffer'

const JSON_HUB_PROTOCOL_NAME = 'json'

/** Implements the JSON Hub Protocol. */
export class JsonCompressionHubProtocol implements IHubProtocol {
  /** @inheritDoc */
  public readonly name: string = JSON_HUB_PROTOCOL_NAME
  /** @inheritDoc */
  public readonly version: number = 1

  /** @inheritDoc */
  public readonly transferFormat: TransferFormat = TransferFormat.Binary

  /** Creates an array of {@link @microsoft/signalr.HubMessage} objects from the specified serialized representation.
   *
   * @param {string} arrayInput A string containing the serialized representation.
   * @param {ILogger} logger A logger that will be used to log messages that occur during parsing.
   */
  public parseMessages(arrayInput: ArrayBuffer, logger: ILogger): HubMessage[] {
    // The interface does allow "ArrayBuffer" to be passed in, but this implementation does not. So let's throw a useful error.
    const decoder = new TextDecoder()
    const input = decoder.decode(arrayInput)

    if (typeof input !== 'string') {
      throw new Error('Invalid input for JSON hub protocol. Expected a string.')
    }

    if (!input) {
      return []
    }

    if (logger === null) {
      logger = NullLogger.instance
    }

    // Parse the messages
    const messages = TextMessageFormat.parse(input)

    const hubMessages = []
    for (const message of messages) {
      const parsedMessage = JSON.parse(message) as HubMessage
      if (typeof parsedMessage.type !== 'number') {
        throw new Error('Invalid payload.')
      }
      switch (parsedMessage.type) {
        case MessageType.Invocation:
          this._isInvocationMessage(parsedMessage)
          break
        case MessageType.StreamItem:
          this._isStreamItemMessage(parsedMessage)
          break
        case MessageType.Completion:
          this._isCompletionMessage(parsedMessage)
          break
        case MessageType.Ping:
          // Single value, no need to validate
          break
        case MessageType.Close:
          // All optional values, no need to validate
          break
        default:
          // Future protocol changes can add message types, old clients can ignore them
          logger.log(LogLevel.Information, "Unknown message type '" + parsedMessage.type + "' ignored.")
          continue
      }
      hubMessages.push(parsedMessage)
    }

    return hubMessages
  }

  /** Writes the specified {@link @microsoft/signalr.HubMessage} to a string and returns it.
   *
   * @param {HubMessage} message The message to write.
   * @returns {string} A string containing the serialized representation of the message.
   */
  public writeMessage(message: HubMessage): ArrayBuffer {
    const json = JSON.stringify(message)
    const buffer = Buffer.from(json)
    const enc = new TextEncoder()
    const uintBuffer = enc.encode(json)

    return BinaryMessageFormat.write(gzip(uintBuffer))
  }

  private _isInvocationMessage(message: InvocationMessage): void {
    this._assertNotEmptyString(message.target, 'Invalid payload for Invocation message.')

    if (message.invocationId !== undefined) {
      this._assertNotEmptyString(message.invocationId, 'Invalid payload for Invocation message.')
    }
  }

  private _isStreamItemMessage(message: StreamItemMessage): void {
    this._assertNotEmptyString(message.invocationId, 'Invalid payload for StreamItem message.')

    if (message.item === undefined) {
      throw new Error('Invalid payload for StreamItem message.')
    }
  }

  private _isCompletionMessage(message: CompletionMessage): void {
    if (message.result && message.error) {
      throw new Error('Invalid payload for Completion message.')
    }

    if (!message.result && message.error) {
      this._assertNotEmptyString(message.error, 'Invalid payload for Completion message.')
    }

    this._assertNotEmptyString(message.invocationId, 'Invalid payload for Completion message.')
  }

  private _assertNotEmptyString(value: any, errorMessage: string): void {
    if (typeof value !== 'string' || value === '') {
      throw new Error(errorMessage)
    }
  }
}
