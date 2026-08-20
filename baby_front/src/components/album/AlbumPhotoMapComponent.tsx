import { useEffect, useRef } from "react";
import { loadKakaoMapScript } from "../../util/kakaoMapLoader";

interface AlbumPhotoMapProps {
  latitude: number;
  longitude: number;
}

const AlbumPhotoMapComponent = ({ latitude, longitude }: AlbumPhotoMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      await loadKakaoMapScript();
      if (cancelled || !mapContainerRef.current) return;

      const kakao = (window as any).kakao;
      const position = new kakao.maps.LatLng(latitude, longitude);

      const map = new kakao.maps.Map(mapContainerRef.current, {
        center: position,
        level: 4,
      });

      new kakao.maps.Marker({ position, map });
    };

    render().catch((err) => console.error(err));

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
};

export default AlbumPhotoMapComponent;
