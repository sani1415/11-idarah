# Capacitor Android (Remote URL)

এই repo-তে Capacitor Android shell আছে। অ্যাপ খুললে live site লোড হয়:

**https://www.idarah786.com**

ওয়েব আপডেট Vercel-এ deploy করলেই অ্যাপ user-দের কাছে নতুন ভার্সন পৌঁছায় (Play Store update ছাড়াই)।

## Package

- App ID: `com.madrasatulmadina.idarah`
- App name: `Idarah`

## প্রয়োজনীয় সফটওয়্যার

1. Node.js (ইতিমধ্যে আছে)
2. Android Studio (Windows)
3. JDK 17 (Android Studio সাধারণত দেয়)

## দ্রুত কমান্ড

```bash
npm install
npm run cap:sync
npm run cap:android
```

Android Studio খুললে **Run** দিয়ে emulator বা USB-connected ফোনে চালান।

## Remote URL মোডে গুরুত্বপূর্ণ

Android shell শুধু WebView দিয়ে `www.idarah786.com` লোড করে। নিচের জিনিসগুলো **ওয়েব সাইটে deploy** হতে হবে:

- `js/capacitor-native.js`
- `js/vendor/capacitor*.js`

এগুলো `npm run build` দিয়ে `public/`-এ যায় এবং Vercel deploy-এর পর অ্যাপে কাজ করে (back button, status bar)।

**প্রথমবার:** Capacitor ফাইলগুলো যোগ করার পর একবার Vercel production deploy করুন।

## Build scripts

| Script | কাজ |
| --- | --- |
| `npm run build` | Static site → `public/` (Vercel + Capacitor vendor copy) |
| `npm run cap:prepare` | Minimal `public/` + Capacitor vendor files |
| `npm run cap:sync` | `public/` → Android project sync |
| `npm run cap:android` | Sync + Android Studio খোলা |

## Release APK/AAB

1. `npm run cap:sync`
2. Android Studio → **Build → Generate Signed Bundle / APK**
3. Keystore তৈরি/বাছাই করুন (একবার হারালে Play Store update দেওয়া কঠিন)
4. Play Console-এ AAB upload

## সীমাবদ্ধতা

- ইন্টারনেট ছাড়া কাজ করবে না (Supabase online)
- `window.print()` Android WebView-এ সীমিত হতে পারে
- File upload বেশিরভাগ ফোনে চলে; device test করুন

## Icon / Splash

ডিফল্ট Capacitor icon ব্যবহার হচ্ছে। নিজের logo দিতে:

- `android/app/src/main/res/` — mipmap icons
- অথবা `@capacitor/assets` plugin দিয়ে generate
