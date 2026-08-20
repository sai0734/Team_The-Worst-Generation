import { useEffect, useRef } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_SERVER_HOST, type MemberQuest } from "../api/questApi";
import { getAccessToken } from "../util/accessTokenStore";

// YSJ - 상대가 긴급퀘를 넣으면 /topic/quest/{내프로필} 로 바로 받음
const useQuestRealtime = (
  profileId: number | undefined,
  onUrgent: (quest: MemberQuest) => void,
) => {
  const onUrgentRef = useRef(onUrgent);
  onUrgentRef.current = onUrgent;

  useEffect(() => {
    if (!profileId) {
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_SERVER_HOST}/ws-chat`),
      connectHeaders: {
        Authorization: `Bearer ${getAccessToken() ?? ""}`,
      },
      reconnectDelay: 3000,
      onConnect: () => {
        client.subscribe(`/topic/quest/${profileId}`, (message: IMessage) => {
          const received = JSON.parse(message.body) as MemberQuest;
          if (!received?.id) {
            return;
          }
          onUrgentRef.current(received);
        });
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [profileId]);
};

export default useQuestRealtime;
