# K-MATE ONE store 사전체험판 배포 체크리스트

원스토어용 APK는 Google Play 빌드와 분리되어 있습니다. `capacitor.config.ts`를 직접 수정하지 말고 아래 명령만 사용합니다.

## 1. APK 만들기

```powershell
npm run build:onestore
```

완성 파일:

```text
dist/onestore/K-MATE-Beta-v1.0.4.apk
```

- 패키지 ID: `com.kmate.app`
- 앱 표시 이름: `K-MATE Beta`
- 버전: `1.0.4-onestore-beta` (`versionCode 5`)
- 서비스 주소: `https://k-mate-v1q6.vercel.app`
- Google Play Billing: 비활성
- 보상형 AdMob 광고: 비활성

빌드 도중 원스토어 설정이 잠시 적용되지만, 끝나면 기존 Google Play용 `capacitor.config.ts`와 Android 설정이 자동 복구됩니다.

## 2. 업로드 전 휴대폰 확인

- APK 설치 및 로그인
- 첫 화면, 캐릭터 채팅, 학습 문제 진입
- 힌트 열기와 문제 완료
- 결제 버튼이나 광고 시청 버튼이 실제 동작하지 않는지 확인
- 개인정보처리방침과 문의 이메일 링크 확인

## 3. ONE store 개발자센터에서 직접 입력할 항목

- 상품 유형: 무료
- 앱 내 결제: 없음
- 광고 노출: 없음
- 사전체험판임을 앱 설명 첫 부분에 표시
- 앱 아이콘, 스크린샷, 상세 설명, 개인정보처리방침 URL 등록
- 테스트 계정이 필요하면 심사 메모에 ID와 비밀번호 입력
- 완성된 `dist/onestore/K-MATE-Beta-v1.0.4.apk` 업로드

## 4. 다음 버전 규칙

업데이트마다 `android/app/build.gradle`의 `versionCode`를 반드시 1 올리고 `versionName`도 변경합니다. 그다음 이 문서와 `scripts/build-onestore.ps1`의 출력 파일명도 같은 버전으로 맞춥니다.

