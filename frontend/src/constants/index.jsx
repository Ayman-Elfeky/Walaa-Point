import { BotMessageSquare } from "lucide-react";
import { BatteryCharging } from "lucide-react";
import { Fingerprint } from "lucide-react";
import { ShieldHalf } from "lucide-react";
import { PlugZap } from "lucide-react";
import { GlobeLock } from "lucide-react";

export const navItems = [
    { label: "Features", href: "features" },
    { label: "Workflow", href: "workflow" },
    { label: "Pricing", href: "pricing" },
    { label: "FAQ", href: "faq" },
];

export const features = {
    en: [
        {
            icon: <BotMessageSquare />,
            text: "Drag-and-Drop Interface",
            description:
                "Easily design and arrange your VR environments with a user-friendly drag-and-drop interface.",
        },
        {
            icon: <Fingerprint />,
            text: "Multi-Platform Compatibility",
            description:
                "Build VR applications that run seamlessly across multiple platforms, including mobile, desktop, and VR headsets.",
        },
        {
            icon: <ShieldHalf />,
            text: "Built-in Templates",
            description:
                "Jumpstart your VR projects with a variety of built-in templates for different types of applications and environments.",
        },
        {
            icon: <BatteryCharging />,
            text: "Real-Time Preview",
            description:
                "Preview your VR application in real-time as you make changes, allowing for quick iterations and adjustments.",
        },
        {
            icon: <PlugZap />,
            text: "Collaboration Tools",
            description:
                "Work together with your team in real-time on VR projects, enabling seamless collaboration and idea sharing.",
        },
        {
            icon: <GlobeLock />,
            text: "Analytics Dashboard",
            description:
                "Gain valuable insights into user interactions and behavior within your VR applications with an integrated analytics dashboard.",
        },
    ],
    ar: [
        {
            icon: <BotMessageSquare />,
            text: "واجهة السحب والإفلات",
            description: "صمم وأنشئ بيئات الواقع الافتراضي بسهولة باستخدام واجهة سحب وإفلات سهلة الاستخدام."
        },
        {
            icon: <Fingerprint />,
            text: "توافق متعدد المنصات",
            description: "قم ببناء تطبيقات تعمل بسلاسة عبر منصات متعددة، بما في ذلك الجوال وسطح المكتب ونظارات الواقع الافتراضي."
        },
        {
            icon: <ShieldHalf />,
            text: "قوالب جاهزة",
            description: "ابدأ مشاريعك بسرعة مع مجموعة متنوعة من القوالب الجاهزة لمختلف أنواع التطبيقات والبيئات."
        },
        {
            icon: <BatteryCharging />,
            text: "معاينة فورية",
            description: "عاين تطبيقك في الوقت الفعلي أثناء إجراء التغييرات، مما يتيح التعديلات السريعة."
        },
        {
            icon: <PlugZap />,
            text: "أدوات التعاون",
            description: "اعمل مع فريقك في الوقت الفعلي على المشاريع، مما يتيح التعاون ومشاركة الأفكار بسلاسة."
        },
        {
            icon: <GlobeLock />,
            text: "لوحة التحليلات",
            description: "احصل على رؤى قيمة حول تفاعلات المستخدمين وسلوكهم داخل تطبيقاتك."
        }
    ]
};

export const pricingOptions = [
    // {
    //     title: "Free",
    //     price: "$0",
    //     features: [
    //         "Private board sharing",
    //         "5 Gb Storage",
    //         "Web Analytics",
    //         "Private Mode",
    //     ],
    // },
    {
        title: "Pro",
        price: "$10",
        features: [
            "Private board sharing",
            "10 Gb Storage",
            "Web Analytics (Advance)",
            "Private Mode",
        ],
    },
    {
        title: "Enterprise",
        price: "$200",
        features: [
            "Private board sharing",
            "Unlimited Storage",
            "High Performance Network",
            "Private Mode",
        ],
    },
];

export const resourcesLinks = [
    { href: "#", text: "Getting Started" },
    { href: "#", text: "Documentation" },
    { href: "#", text: "Tutorials" },
    { href: "#", text: "API Reference" },
    { href: "#", text: "Community Forums" },
];

export const platformLinks = [
    { href: "#", text: "Features" },
    { href: "#", text: "Supported Devices" },
    { href: "#", text: "System Requirements" },
    { href: "#", text: "Downloads" },
    { href: "#", text: "Release Notes" },
];

export const communityLinks = [
    { href: "#", text: "Events" },
    { href: "#", text: "Meetups" },
    { href: "#", text: "Conferences" },
    { href: "#", text: "Hackathons" },
    { href: "#", text: "Jobs" },
];