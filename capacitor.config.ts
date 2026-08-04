import type { CapacitorConfig } from '@capacitor/cli';

// K-MATE는 Next.js SSR + API 라우트(/api/memory 등)를 쓰기 때문에 `next export`로
// 정적 번들을 만들 수 없다. 그래서 webDir에 정적 파일을 담아 배포하는 방식 대신,
// server.url로 실제 배포된 웹사이트를 그대로 불러오는 "리모트 URL" 방식을 쓴다.
// webDir은 Capacitor가 요구해서 넣는 형식상의 값일 뿐, 실제로는 쓰이지 않는다.
//
// - 로컬 개발/에뮬레이터 테스트: 10.0.2.2는 안드로이드 에뮬레이터에서 호스트 PC의
//   localhost를 가리키는 특수 주소 — `npm run dev`가 떠 있어야 동작한다.
// - 실제 배포 후에는 아래 url을 배포된 도메인(https://...)으로 바꾸고 cleartext를
//   지워야 한다(https는 cleartext 설정 불필요).
const config: CapacitorConfig = {
  appId: 'com.kmate.app',
  appName: 'K-MATE',
  webDir: 'public',
  server: {
    url: 'https://k-mate-v1q6.vercel.app',
    cleartext: false,
  },
};

export default config;
