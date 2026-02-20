export interface JoinRoomDto {
  roomId: string;
}

export interface SendMessageDto {
  roomId: string;
  content: string;
}

export interface CreateRoomDto {
  name: string;
  isGroup: boolean;
}

export interface TypingDto {
  roomId: string;
  isTyping: boolean;
}
