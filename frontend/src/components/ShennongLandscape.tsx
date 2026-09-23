export default function ShennongLandscape() {
  return (
    <svg className="shennong-landscape-svg" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Green agricultural valley with mountains and fields">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#eef7ee"/><stop offset=".58" stopColor="#d8e9d5"/><stop offset="1" stopColor="#b5cda8"/></linearGradient>
        <linearGradient id="mountain" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#809d80"/><stop offset="1" stopColor="#426348"/></linearGradient>
        <linearGradient id="field" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b7cf87"/><stop offset="1" stopColor="#50754a"/></linearGradient>
        <linearGradient id="river" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#cfe4d7"/><stop offset="1" stopColor="#79a98a"/></linearGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="12"/></filter>
      </defs>
      <rect width="1200" height="700" fill="url(#sky)"/>
      <g opacity=".45" filter="url(#soft)"><ellipse cx="250" cy="280" rx="300" ry="45" fill="#fff"/><ellipse cx="840" cy="320" rx="340" ry="55" fill="#fff"/></g>
      <path d="M0 365L170 195 265 300 390 120 535 300 655 170 785 315 950 120 1200 355V500H0Z" fill="#6d8c71" opacity=".7"/>
      <path d="M0 420L180 245 300 350 440 155 590 355 740 210 860 355 1010 185 1200 395V510H0Z" fill="url(#mountain)"/>
      <path d="M0 440L190 300 325 390 440 225 560 395 730 275 860 405 1015 245 1200 415V530H0Z" fill="#58785b" opacity=".8"/>
      <path d="M0 455C170 425 280 440 405 470C560 507 650 445 800 450C960 455 1070 420 1200 440V700H0Z" fill="url(#field)"/>
      <path d="M0 520C170 475 300 510 435 545C570 580 690 505 820 520C970 535 1070 495 1200 515" fill="none" stroke="#d8e8b0" strokeWidth="28" opacity=".8"/>
      <path d="M0 590C200 545 320 590 475 620C630 650 730 560 875 590C1020 620 1100 570 1200 575" fill="none" stroke="#88aa67" strokeWidth="34"/>
      <path d="M725 700C805 650 800 600 748 555C700 514 735 470 790 455C845 440 915 475 935 520C960 575 900 625 1025 700Z" fill="url(#river)" opacity=".95"/>
      <g fill="#35563a" opacity=".9"><circle cx="145" cy="460" r="24"/><circle cx="185" cy="472" r="17"/><circle cx="270" cy="500" r="22"/><circle cx="1000" cy="470" r="28"/><circle cx="1060" cy="455" r="20"/><circle cx="1120" cy="480" r="25"/></g>
      <g fill="#2e5238" opacity=".85"><path d="M80 510l24-82 24 82Z"/><path d="M1130 530l28-98 28 98Z"/><path d="M1090 520l20-72 20 72Z"/></g>
      <g stroke="#e8f0cf" strokeWidth="3" opacity=".8"><path d="M40 560C180 520 300 560 420 585"/><path d="M45 610C190 570 300 610 420 635"/><path d="M890 565C1000 535 1100 560 1180 545"/><path d="M875 620C1010 590 1100 610 1190 590"/></g>
      <g fill="#f6f0d7" opacity=".95"><path d="M955 505l25-22 25 22v24h-50Z"/><path d="M1000 520l20-18 20 18v18h-40Z"/><path d="M305 525l20-18 20 18v17h-40Z"/></g>
    </svg>
  );
}
