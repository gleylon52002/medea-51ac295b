# Medea - Android Uygulama Yapım Rehberi

## 📋 Gereksinimler

Başlamadan önce aşağıdaki araçların bilgisayarınızda kurulu olması gerekir:

| Araç | Minimum Versiyon | İndirme Linki |
|------|------------------|---------------|
| **Node.js** | v18+ | [nodejs.org](https://nodejs.org/) |
| **npm** | v9+ | Node.js ile birlikte gelir |
| **Android Studio** | Hedgehog (2023.1.1)+ | [developer.android.com](https://developer.android.com/studio) |
| **Java JDK** | 17+ | Android Studio ile birlikte gelir |
| **Git** | Herhangi bir güncel sürüm | [git-scm.com](https://git-scm.com/) |

---

## 🔧 Adım 1: Android Studio Kurulumu

### 1.1 Android Studio İndirme ve Kurma

1. [developer.android.com/studio](https://developer.android.com/studio) adresinden Android Studio'yu indirin
2. Kurulum sihirbazını takip edin (tüm varsayılan ayarları kabul edin)
3. İlk açılışta **"Standard"** kurulum tipini seçin

### 1.2 SDK Yapılandırması

Android Studio açıldıktan sonra:

1. **File → Settings → Languages & Frameworks → Android SDK** (Mac: **Android Studio → Preferences → ...**)
2. **SDK Platforms** sekmesinde şunları işaretleyin:
   - ✅ Android 14.0 (API 34)
   - ✅ Android 13.0 (API 33)
3. **SDK Tools** sekmesinde şunları işaretleyin:
   - ✅ Android SDK Build-Tools
   - ✅ Android SDK Command-line Tools
   - ✅ Android SDK Platform-Tools
   - ✅ Android Emulator
4. **Apply** → **OK** tıklayın ve indirmelerin tamamlanmasını bekleyin

### 1.3 Ortam Değişkenlerini Ayarlama

#### Windows:
```
Sistem Özellikleri → Gelişmiş → Ortam Değişkenleri

Yeni Sistem Değişkeni ekleyin:
  Değişken adı: ANDROID_HOME
  Değişken değeri: C:\Users\<KULLANICI_ADINIZ>\AppData\Local\Android\Sdk

Path değişkenine şunları ekleyin:
  %ANDROID_HOME%\platform-tools
  %ANDROID_HOME%\tools
  %ANDROID_HOME%\tools\bin
```

#### macOS/Linux:
```bash
# ~/.bashrc veya ~/.zshrc dosyasına ekleyin:
export ANDROID_HOME=$HOME/Android/Sdk
# macOS için: export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Terminali yeniden açın ve doğrulayın:
```bash
adb --version
```

---

## 📦 Adım 2: Projeyi GitHub'dan Çekme

### 2.1 Lovable'dan GitHub'a Export

1. Lovable editöründe sol üstteki proje adına tıklayın
2. **Settings** → **GitHub** sekmesine gidin
3. **"Export to GitHub"** butonuna tıklayın
4. Repo adını belirleyin (örn: `medea-app`)
5. Export işleminin tamamlanmasını bekleyin

### 2.2 Projeyi Bilgisayarınıza Klonlama

```bash
# Projeyi klonlayın
git clone https://github.com/KULLANICI_ADINIZ/medea-app.git

# Proje klasörüne girin
cd medea-app
```

---

## 🛠️ Adım 3: Proje Bağımlılıklarını Kurma

```bash
# Bağımlılıkları yükleyin
npm install
```

> ⚠️ **Not:** Eğer hata alırsanız `npm install --legacy-peer-deps` komutunu deneyin.

---

## 📱 Adım 4: Android Platformunu Ekleme

```bash
# Android platformunu ekleyin
npx cap add android

# Platform bağımlılıklarını güncelleyin
npx cap update android
```

Bu komut proje kök dizininde bir `android/` klasörü oluşturacaktır.

---

## 🔨 Adım 5: Projeyi Derleme ve Senkronize Etme

```bash
# Web projesini derleyin
npm run build

# Capacitor ile Android projesine senkronize edin
npx cap sync android
```

> 💡 **Önemli:** Her kod değişikliğinden sonra `npm run build && npx cap sync android` komutlarını çalıştırmanız gerekir. Ancak geliştirme sırasında hot-reload aktif olduğu için bu sadece production build için gereklidir.

---

## 🚀 Adım 6: Uygulamayı Çalıştırma

### Seçenek A: Emülatörde Çalıştırma

#### Emülatör Oluşturma:
1. Android Studio'yu açın
2. **Tools → Device Manager** (veya **Virtual Device Manager**)
3. **Create Virtual Device** tıklayın
4. Bir cihaz seçin (önerilen: **Pixel 7**)
5. Sistem imajı seçin (önerilen: **API 34 - Android 14**)
6. **Finish** tıklayın
7. ▶️ Play butonuna basarak emülatörü başlatın

#### Uygulamayı Emülatörde Çalıştırma:
```bash
npx cap run android
```

### Seçenek B: Fiziksel Cihazda Çalıştırma

1. **Telefonunuzda Geliştirici Seçeneklerini aktifleştirin:**
   - Ayarlar → Telefon Hakkında → **Yapı Numarası**'na 7 kez dokunun
   - Ayarlar → Geliştirici Seçenekleri → **USB Hata Ayıklama**'yı açın

2. **Telefonu USB kablosuyla bilgisayara bağlayın**

3. **Bağlantıyı doğrulayın:**
   ```bash
   adb devices
   # Cihazınızın listelendiğini görmelisiniz
   ```

4. **Uygulamayı çalıştırın:**
   ```bash
   npx cap run android
   ```
   Birden fazla cihaz/emülatör varsa seçim ekranı gelecektir.

### Seçenek C: Android Studio Üzerinden Çalıştırma

```bash
# Android projesini Android Studio'da açın
npx cap open android
```

Android Studio açıldıktan sonra:
1. Üst araç çubuğundan cihaz/emülatör seçin
2. ▶️ **Run** butonuna tıklayın (veya `Shift + F10`)

---

## 🔴 Adım 7: Geliştirme Notları

Proje artık **production modda** çalışacak şekilde yapılandırılmıştır. `capacitor.config.json` dosyasında `server` bloğu **yoktur**, yani uygulama kendi `dist/` klasöründeki dosyalardan çalışır.

> ⚠️ **Geliştirme sırasında hot-reload** istiyorsanız, `capacitor.config.json`'a geçici olarak şunu ekleyin:
> ```json
> "server": {
>   "url": "http://BILGISAYAR_IP:5173",
>   "cleartext": true
> }
> ```
> Production build için bu bloğu **mutlaka kaldırın**.

---

## 📦 Adım 8: APK / AAB Oluşturma (Yayınlama)

### 8.1 Production Build Hazırlığı

`capacitor.config.json` dosyasından `server` bloğunu kaldırın:

```json
{
  "appId": "app.lovable.f9703bb84ab14aab97d5be5278009ddc",
  "appName": "medea",
  "webDir": "dist"
}
```

Sonra:
```bash
npm run build
npx cap sync android
```

### 8.2 İmzalama Anahtarı (Keystore) Oluşturma

```bash
keytool -genkey -v -keystore medea-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias medea

# Sizden bilgiler istenecek:
#   Keystore şifresi: (güçlü bir şifre belirleyin, NOT ALIN!)
#   Ad Soyad: Medea
#   Organizasyon: Medea
#   Şehir: Istanbul
#   Ülke kodu: TR
```

> 🔒 **KRİTİK:** `medea-release-key.jks` dosyasını ve şifrenizi güvenli bir yerde saklayın. Kaybederseniz uygulamanızı güncelleyemezsiniz!

### 8.3 Release APK Oluşturma

1. Android Studio'da projeyi açın: `npx cap open android`
2. **Build → Generate Signed Bundle / APK**
3. **APK** seçin → **Next**
4. Keystore bilgilerinizi girin → **Next**
5. **release** build variant'ını seçin → **Finish**

APK dosyası: `android/app/build/outputs/apk/release/app-release.apk`

### 8.4 AAB (Android App Bundle) Oluşturma — Play Store için

1. Adım 8.3'teki gibi ama **Android App Bundle** seçin
2. AAB dosyası: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 🏪 Adım 9: Google Play Store'a Yükleme

### 9.1 Geliştirici Hesabı

1. [play.google.com/console](https://play.google.com/console) adresine gidin
2. **Geliştirici hesabı oluşturun** (tek seferlik 25$ ücret)
3. Kimlik doğrulama sürecini tamamlayın

### 9.2 Uygulama Oluşturma

1. Play Console'da **"Uygulama oluştur"** tıklayın
2. Uygulama bilgilerini doldurun:
   - **Uygulama adı:** Medea
   - **Varsayılan dil:** Türkçe
   - **Uygulama türü:** Uygulama
   - **Ücretsiz/Ücretli:** Ücretsiz

### 9.3 Mağaza Listesi Hazırlama

Şu materyalleri hazırlayın:

| Materyal | Boyut | Zorunlu |
|----------|-------|---------|
| Uygulama ikonu | 512x512 px | ✅ |
| Öne çıkan grafik | 1024x500 px | ✅ |
| Telefon ekran görüntüleri | Min. 2 adet, 16:9 veya 9:16 | ✅ |
| Tablet ekran görüntüleri | Min. 1 adet | ❌ |
| Kısa açıklama | Maks. 80 karakter | ✅ |
| Tam açıklama | Maks. 4000 karakter | ✅ |

### 9.4 AAB Yükleme ve Yayınlama

1. **Üretim → Yeni sürüm oluştur**
2. AAB dosyasını yükleyin
3. Sürüm notlarını yazın
4. **İncelemeye gönder** tıklayın

> ⏳ Google inceleme süreci genelde **1-3 gün** sürer.

---

## 🎨 Adım 10: Uygulama İkonu ve Splash Screen

### 10.1 İkon Ayarlama

1. Android Studio'da: **File → New → Image Asset**
2. **Icon Type:** Launcher Icons
3. Kendi ikon dosyanızı seçin (1024x1024 px önerilir)
4. Tüm varyasyonların önizlemesini kontrol edin
5. **Finish** tıklayın

### 10.2 Splash Screen

`android/app/src/main/res/values/styles.xml` dosyasında:

```xml
<style name="AppTheme.NoActionBar" parent="Theme.AppCompat.Light.NoActionBar">
    <item name="android:background">@drawable/splash</item>
</style>
```

`android/app/src/main/res/drawable/splash.xml` oluşturun:

```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/white"/>
    <item
        android:drawable="@drawable/ic_launcher_foreground"
        android:gravity="center"
        android:width="128dp"
        android:height="128dp"/>
</layer-list>
```

---

## 🐛 Sık Karşılaşılan Sorunlar ve Çözümleri

### Sorun: "SDK location not found"
```
# local.properties dosyası oluşturun (android/ klasöründe)
# Windows:
sdk.dir=C:\\Users\\KULLANICI_ADINIZ\\AppData\\Local\\Android\\Sdk

# macOS:
sdk.dir=/Users/KULLANICI_ADINIZ/Library/Android/sdk
```

### Sorun: "INSTALL_FAILED_UPDATE_INCOMPATIBLE"
```bash
# Eski uygulamayı cihazdan kaldırın
adb uninstall app.lovable.f9703bb84ab14aab97d5be5278009ddc
```

### Sorun: Gradle build hatası
```bash
# android/ klasöründe cache temizleyin
cd android
./gradlew clean
cd ..
npx cap sync android
```

### Sorun: "cleartext communication not permitted"
`android/app/src/main/AndroidManifest.xml` dosyasında `<application>` etiketine ekleyin:
```xml
android:usesCleartextTraffic="true"
```

### Sorun: Emülatör çok yavaş
- Android Studio → **Device Manager** → Cihaz ayarları
- **Graphics:** "Hardware - GLES 2.0" seçin
- RAM'i artırın (en az 2048 MB)
- BIOS'tan **Intel VT-x** veya **AMD-V** sanallaştırmayı aktifleştirin

---

## 📝 Faydalı Komutlar Özeti

```bash
# Proje kurulumu
npm install                      # Bağımlılıkları yükle
npx cap add android              # Android platformu ekle

# Geliştirme
npx cap run android              # Emülatör/cihazda çalıştır
npx cap open android             # Android Studio'da aç

# Production build
npm run build                    # Web projesini derle
npx cap sync android             # Android'e senkronize et

# Sorun giderme
cd android && ./gradlew clean    # Cache temizle
adb devices                      # Bağlı cihazları listele
adb logcat                       # Cihaz loglarını görüntüle
```

---

## 📚 Faydalı Kaynaklar

- [Capacitor Resmi Dokümantasyon](https://capacitorjs.com/docs)
- [Android Studio Kullanım Kılavuzu](https://developer.android.com/studio/intro)
- [Google Play Console Yardım](https://support.google.com/googleplay/android-developer)
- [Lovable Mobil Uygulama Rehberi](https://docs.lovable.dev/)

---

> 📅 Son güncelleme: 28 Şubat 2026
> 
> Bu rehber Medea e-ticaret platformu için özel olarak hazırlanmıştır.
