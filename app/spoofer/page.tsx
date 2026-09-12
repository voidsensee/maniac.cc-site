"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Starfield from "@/components/Starfield";
import Navbar from "@/components/Navbar";

type Lang = "ru" | "en";

export default function SpooferPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("ru");

  const t = {
    ru: {
      title: "Spoofer for Majestic RP",
      subtitle: "Полный обход блокировок и банов",
      cta: "Купить",
      price: "500 Ɱ",
      features: [
        "Изменение HWID без переустановки Windows",
        "Обход HWID-бана на Majestic RP",
        "Совместимость с GTA V Legacy / alt:V",
        "Безопасно для системы — не трогает реестр",
        "Работает с античитом MAC",
        "Поддержка 24/7 через тикеты",
      ],
      howto_title: "Как использовать",
      howto: [
        "Купи Spoofer в магазине (500 Ɱ с баланса)",
        "Скачай spoofer.exe из dashboard",
        "Отключи античит Majestic RP (закрой лаунчер)",
        "Запусти spoofer.exe от имени администратора",
        "Нажми «Spoof HWID» и дождись подтверждения",
        "Перезагрузи ПК",
        "Заходи в Majestic RP с новым HWID",
      ],
      warning_title: "Важно",
      warning:
        "Spoofer изменяет HWID на уровне ядра. Использование на свой риск. Мы не несём ответственности за возможные баны в будущем. Если тебя поймали в момент смены HWID — верни Mani через тикет.",
      buy_btn: "Купить за 500 Ɱ",
      back_btn: "← Назад в dashboard",
    },
    en: {
      title: "Spoofer for Majestic RP",
      subtitle: "Full bypass for bans and blocks",
      cta: "Buy",
      price: "500 Ɱ",
      features: [
        "Change HWID without reinstalling Windows",
        "Bypass HWID ban on Majestic RP",
        "Compatible with GTA V Legacy / alt:V",
        "Safe for system — doesn't touch registry",
        "Works with MAC anticheat",
        "24/7 support via tickets",
      ],
      howto_title: "How to use",
      howto: [
        "Buy Spoofer in the shop (500 Ɱ from balance)",
        "Download spoofer.exe from dashboard",
        "Disable Majestic RP anticheat (close launcher)",
        "Run spoofer.exe as administrator",
        "Click «Spoof HWID» and wait for confirmation",
        "Restart PC",
        "Join Majestic RP with new HWID",
      ],
      warning_title: "Important",
      warning:
        "Spoofer changes HWID at kernel level. Use at your own risk. We're not responsible for future bans. If you get caught during HWID change — refund Mani via ticket.",
      buy_btn: "Buy for 500 Ɱ",
      back_btn: "← Back to dashboard",
    },
  }[lang];

  const buy = () => {
    alert("Buy flow will be connected after product release.");
  };

  return (
    <>
      <Starfield />
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-12">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-white/40 hover:text-white"
        >
          {t.back_btn}
        </button>

        <div className="mt-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">{t.title}</h1>
            <p className="mt-2 text-white/50">{t.subtitle}</p>
          </div>

          <div className="flex overflow-hidden rounded-lg border border-white/10">
            <button
              onClick={() => setLang("ru")}
              className={`px-3 py-1.5 text-xs ${
                lang === "ru" ? "bg-accent-purple text-white" : "text-white/60"
              }`}
            >
              RU
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 text-xs ${
                lang === "en" ? "bg-accent-purple text-white" : "text-white/60"
              }`}
            >
              EN
            </button>
          </div>
        </div>

        <div className="glass mt-8 rounded-2xl p-8">
          <h2 className="text-sm uppercase tracking-wider text-white/40">
            {lang === "ru" ? "Возможности" : "Features"}
          </h2>
          <ul className="mt-4 space-y-2">
            {t.features.map((f, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-purple" />
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={buy}
              className="btn-primary rounded-lg px-6 py-3 text-sm font-medium"
            >
              {t.buy_btn}
            </button>
            <span className="text-xl font-bold text-amber-300">{t.price}</span>
          </div>
        </div>

        <div className="glass mt-6 rounded-2xl p-8">
          <h2 className="text-sm uppercase tracking-wider text-white/40">
            {t.howto_title}
          </h2>
          <ol className="mt-4 space-y-3">
            {t.howto.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-purple/20 text-xs font-medium text-accent-purple">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="glass mt-6 rounded-2xl border-red-500/20 p-6">
          <h2 className="text-sm uppercase tracking-wider text-red-400">
            {t.warning_title}
          </h2>
          <p className="mt-3 text-sm text-white/70">{t.warning}</p>
        </div>
      </main>
    </>
  );
}
