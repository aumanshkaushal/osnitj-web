import { sql } from "@/lib/db";
import fs from "fs";
import path from "path";
import os from "os";

export type FaqTag = {
  id: string;
  slug: string;
  label: string;
  icon: string;
  created_at: Date;
};

export type FaqQuestion = {
  id: string;
  slug: string;
  tag_slug: string;
  question: string;
  answer: string;
  order_index: number;
  created_at: Date;
  updated_at: Date;
};

export async function getFaqTagsFromDb(): Promise<FaqTag[]> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  const rows = await sql`
    select id, slug, label, icon, created_at
    from public.faq_tags
    order by slug asc
  `;

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    label: row.label,
    icon: row.icon,
    created_at: new Date(row.created_at),
  }));
}

export async function createFaqTagInDb(tag: {
  slug: string;
  label: string;
  icon: string;
}): Promise<FaqTag> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  const [row] = await sql`
    insert into public.faq_tags (slug, label, icon)
    values (${tag.slug}, ${tag.label}, ${tag.icon})
    returning id, slug, label, icon, created_at
  `;

  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    icon: row.icon,
    created_at: new Date(row.created_at),
  };
}

export async function updateFaqTagInDb(
  slug: string,
  tag: {
    label: string;
    icon: string;
  },
): Promise<void> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  await sql`
    update public.faq_tags
    set label = ${tag.label}, icon = ${tag.icon}
    where slug = ${slug}
  `;
}

export async function deleteFaqTagFromDb(slug: string): Promise<void> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  await sql`
    delete from public.faq_tags
    where slug = ${slug}
  `;
}

export async function getFaqQuestionsFromDb(): Promise<FaqQuestion[]> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  const rows = await sql`
    select id, slug, tag_slug, question, answer, order_index, created_at, updated_at
    from public.faq_questions
    order by order_index asc, created_at desc
  `;

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    tag_slug: row.tag_slug,
    question: row.question,
    answer: row.answer,
    order_index: row.order_index,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  }));
}

export async function createFaqQuestionInDb(question: {
  slug: string;
  tag_slug: string;
  question: string;
  answer: string;
  order_index: number;
}): Promise<FaqQuestion> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  const [row] = await sql`
    insert into public.faq_questions (slug, tag_slug, question, answer, order_index)
    values (${question.slug}, ${question.tag_slug}, ${question.question}, ${question.answer}, ${question.order_index})
    returning id, slug, tag_slug, question, answer, order_index, created_at, updated_at
  `;

  return {
    id: row.id,
    slug: row.slug,
    tag_slug: row.tag_slug,
    question: row.question,
    answer: row.answer,
    order_index: row.order_index,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

export async function updateFaqQuestionInDb(
  id: string,
  question: {
    slug: string;
    tag_slug: string;
    question: string;
    answer: string;
    order_index: number;
  },
): Promise<void> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  await sql`
    update public.faq_questions
    set
      slug = ${question.slug},
      tag_slug = ${question.tag_slug},
      question = ${question.question},
      answer = ${question.answer},
      order_index = ${question.order_index},
      updated_at = now()
    where id = ${id}
  `;
}

export async function deleteFaqQuestionFromDb(id: string): Promise<void> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  await sql`
    delete from public.faq_questions
    where id = ${id}
  `;
}

interface CachedData {
  tags: FaqTag[];
  questions: FaqQuestion[];
  timestamp: number;
}

const faqGlobal = global as unknown as {
  faqMemoryCache: CachedData | null;
};

if (!faqGlobal.faqMemoryCache) {
  faqGlobal.faqMemoryCache = null;
}

const CACHE_PATH = path.join(os.tmpdir(), "nitj-faq-cache.json");

export async function getCachedFaqData(): Promise<{
  tags: FaqTag[];
  questions: FaqQuestion[];
}> {
  const now = Date.now();
  const cacheDurationMs = 120000;
  if (faqGlobal.faqMemoryCache) {
    const ageMs = now - faqGlobal.faqMemoryCache.timestamp;
    if (ageMs < cacheDurationMs) {
      return {
        tags: faqGlobal.faqMemoryCache.tags,
        questions: faqGlobal.faqMemoryCache.questions,
      };
    }
  }

  let fileCacheData: CachedData | null = null;
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const stats = fs.statSync(CACHE_PATH);
      const ageMs = now - stats.mtimeMs;
      const fileContent = fs.readFileSync(CACHE_PATH, "utf8");
      const parsed = JSON.parse(fileContent);

      const tags = parsed.tags;
      const questions = parsed.questions.map((q: any) => ({
        ...q,
        created_at: new Date(q.created_at),
        updated_at: new Date(q.updated_at),
      }));

      fileCacheData = {
        tags,
        questions,
        timestamp: stats.mtimeMs,
      };

      if (ageMs < cacheDurationMs) {
        faqGlobal.faqMemoryCache = fileCacheData;
        return { tags, questions };
      }
    }
  } catch (e) {
    console.warn("Failed to read FAQ file cache:", e);
  }

  try {
    const tags = await getFaqTagsFromDb();
    const questions = await getFaqQuestionsFromDb();

    faqGlobal.faqMemoryCache = { tags, questions, timestamp: now };

    try {
      const dir = path.dirname(CACHE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        CACHE_PATH,
        JSON.stringify({ tags, questions, timestamp: now }),
        "utf8",
      );
    } catch (e) {
      console.warn("Failed to write FAQ file cache:", e);
    }

    return { tags, questions };
  } catch (dbError) {
    console.error(
      "Database query failed in getCachedFaqData, attempting fallback caching:",
      dbError,
    );

    if (faqGlobal.faqMemoryCache) {
      console.log("Using expired in-memory cache as fallback");
      return {
        tags: faqGlobal.faqMemoryCache.tags,
        questions: faqGlobal.faqMemoryCache.questions,
      };
    }

    if (fileCacheData) {
      console.log("Using expired file cache as fallback");
      return {
        tags: fileCacheData.tags,
        questions: fileCacheData.questions,
      };
    }

    console.warn(
      "No cache available. Returning fallback static FAQ datasets to prevent crash.",
    );
    return { tags: FALLBACK_FAQ_TAGS, questions: FALLBACK_FAQ_QUESTIONS };
  }
}

const FALLBACK_FAQ_TAGS: FaqTag[] = [
  { id: "fallback-hostels", slug: "hostels", label: "Hostels & Mess", icon: "Home", created_at: new Date("2026-01-01") },
  { id: "fallback-academics", slug: "academics", label: "Academics", icon: "BookOpen", created_at: new Date("2026-01-01") },
  { id: "fallback-general", slug: "general", label: "Campus & Logistics", icon: "Compass", created_at: new Date("2026-01-01") },
  { id: "fallback-wifi", slug: "wifi", label: "Wi-Fi & IT", icon: "Wifi", created_at: new Date("2026-01-01") },
  { id: "fallback-clubs", slug: "clubs", label: "Clubs & Tech", icon: "Users", created_at: new Date("2026-01-01") },
];

const FALLBACK_FAQ_QUESTIONS: FaqQuestion[] = [
  {
    id: "fallback-q1",
    slug: "hostels-allotted-first-year",
    tag_slug: "hostels",
    question: "Which hostels are allotted to first-year students?",
    answer: "First-year boys are typically allotted BH-1, BH-2, or specific blocks of the Mega Hostels. First-year girls are accommodated in GH-1 or the Mega Girls Hostel. The specific allotment details are updated during the physical reporting period on the official institute portal. Room sharing is usually double or triple occupancy for freshers.",
    order_index: 10,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
  },
  {
    id: "fallback-q2",
    slug: "online-hostel-allotment-process-ohap",
    tag_slug: "hostels",
    question: "What is the Online Hostel Allotment Process (OHAP)?",
    answer: "OHAP is the online portal (usually at ha.nitj.ac.in) used to select rooms and pay hostel and mess advances. You will need to upload your institute admission fee receipt and fill in your preferences. Make sure to complete the payment within the deadline to secure your room. Please note: Local students residing within a 30 km radius of Jalandhar city are generally not eligible for hostels.",
    order_index: 20,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
  },
  {
    id: "fallback-q3",
    slug: "mess-food-change-mess",
    tag_slug: "hostels",
    question: "How is the mess food? Can we change our mess?",
    answer: "Hostels have student-run or contractor-managed messes. The menu is decided by the student mess committee and updated monthly to ensure a variety of nutritious meals. If you are unsatisfied with the quality or service, complaints can be registered with the hostel warden or mess manager. Generally, you cannot change messes mid-semester unless you are shifted to another hostel.",
    order_index: 30,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
  },
  {
    id: "fallback-q4",
    slug: "hostel-curfew-timings",
    tag_slug: "hostels",
    question: "What are the hostel curfew timings?",
    answer: "First-year hostels have strict curfew timings for safety and discipline. Currently, the curfew is usually 9:30 PM or 10:00 PM for boys and 7:00 PM or 8:00 PM for girls. Biometric or register attendance is recorded every night. Curfew timings are relaxed slightly in the subsequent years.",
    order_index: 40,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
  },
  {
    id: "fallback-q5",
    slug: "prohibited-appliances-hostel-rooms",
    tag_slug: "hostels",
    question: "Can we use electric kettles, room heaters, or irons in our rooms?",
    answer: "No, high-power electrical appliances are strictly prohibited in hostel rooms due to safety guidelines and electricity load constraints. Using them can result in confiscation of the appliance and a fine.",
    order_index: 55,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
  },
  {
    id: "fallback-q6",
    slug: "buy-room-essentials",
    tag_slug: "hostels",
    question: "Where do I buy room essentials (buckets, mattress, pillows)?",
    answer: "The campus shopping complexes (located near Hostel 1/2 and Mega Hostels) have dedicated shops that sell mattresses, pillows, buckets, mugs, bedsheets, and basic toiletries. During registration days, temporary vendors also set up stalls on campus, making it easy to buy everything locally.",
    order_index: 60,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
  },
  {
    id: "fallback-q7",
    slug: "attendance-75-rule",
    tag_slug: "academics",
    question: "What is the 75% attendance rule? Is it strictly enforced?",
    answer: "Yes, NIT Jalandhar strictly enforces a minimum of 75% attendance in both lectures and practical classes. Falling below this threshold without valid medical reasons (approved by the HOD) will result in being detrained (Grade 'W' or 'F'), meaning you will not be allowed to sit for the end-semester examinations.",
    order_index: 10,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
  },
  {
    id: "fallback-q8",
    slug: "grading-system-structured",
    tag_slug: "academics",
    question: "How is the grading system structured?",
    answer: "The institute uses a 10-point CGPA grading scale. Grades range from 'S' (Outstanding, 10 points), 'A' (Excellent, 9 points), 'B' (Very Good, 8 points), 'C' (Good, 7 points), 'D' (Fair, 6 points), down to 'E' (Marginal, 4 points) and 'F' (Fail, 0 points). Continuous assessment includes two Minor Exams, Class Quizzes/Assignments, and one Major Exam per semester.",
    order_index: 20,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
  },
  {
    id: "fallback-q9",
    slug: "change-branch-after-first-year",
    tag_slug: "academics",
    question: "Can I change my branch after the first year?",
    answer: "Yes, branch change is allowed at the end of the first year (after the 2nd semester). It is strictly merit-based, depending on your CGPA (usually requires a CGPA > 8.0 or 8.5 with no backlogs). The availability of vacant seats in the target branch also plays a major role, and the change is finalized as per Senate rules.",
    order_index: 30,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
  },
  {
    id: "fallback-q10",
    slug: "fail-course-f-grade",
    tag_slug: "academics",
    question: "What happens if I fail a course (get an 'F' grade)?",
    answer: "If you fail a course, you must clear it by writing a re-appear examination (conducted in subsequent semesters) or registering for the course again in the summer semester (if offered). It is highly recommended to clear backlogs as early as possible to avoid placement restrictions in final years.",
    order_index: 40,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
  },
  {
    id: "fallback-q11",
    slug: "reach-nit-jalandhar-campus",
    tag_slug: "general",
    question: "How do I reach the NIT Jalandhar campus?",
    answer: "The campus is located on the Jalandhar-Amritsar highway (GT Road Bypass). From Jalandhar City Railway Station (JUC), it is ~12 km, and from Jalandhar Cantt Railway Station (JRC), it is ~16 km. Auto-rickshaws (sharing or private) and cabs are readily available from both stations. Amritsar Airport (ATQ) is about 80 km away, with direct buses and cabs available to Jalandhar.",
    order_index: 10,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
  },
  {
    id: "fallback-q12",
    slug: "cycles-allowed-on-campus",
    tag_slug: "general",
    question: "Are cycles allowed on campus? Do I need one?",
    answer: "Yes, bicycles are highly recommended and widely used by students. The campus is vast (around 154 acres), and walking from the Mega Hostels to the academic blocks or central library takes 12–15 minutes. Please note: Motorized two-wheelers (motorcycles, scooters) and cars are strictly prohibited for hostel residents.",
    order_index: 20,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
  },
  {
    id: "fallback-q13",
    slug: "medical-facilities-on-campus",
    tag_slug: "general",
    question: "What medical facilities are available on campus?",
    answer: "The campus has a dedicated Dispensary with resident doctors, nursing staff, and basic medicines available free of cost for students. For emergencies, an ambulance is available 24/7 to transport students to major hospitals in Jalandhar city.",
    order_index: 30,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
  },
  {
    id: "fallback-q14",
    slug: "print-documents-buy-stationery",
    tag_slug: "general",
    question: "Where can I print documents or buy stationery?",
    answer: "Stationery shops are located inside the campus shopping complexes and near the main academic blocks. They offer printing, photocopying, spiral binding, academic supplies, and notebook essentials at standard student rates.",
    order_index: 40,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
  },
  {
    id: "fallback-q15",
    slug: "dress-code-classes-labs",
    tag_slug: "general",
    question: "What is the dress code for classes and labs?",
    answer: "There is no formal dress code for daily lectures, but decent and appropriate casual wear is expected. However, for laboratory sessions, workshops, formal presentations, and placement events, you must wear formal attire (or lab coats/safety shoes as specified by the respective department).",
    order_index: 50,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
  },
  {
    id: "fallback-q16",
    slug: "get-wifi-lan-credentials",
    tag_slug: "wifi",
    question: "How do I get Wi-Fi or LAN credentials?",
    answer: "Every student is provided with a unique login ID and password for internet access. You must submit a Wi-Fi registration form (available at the Computer Centre website or office) along with your MAC address to register your devices (laptops and phones) on the campus network.",
    order_index: 10,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
  },
  {
    id: "fallback-q17",
    slug: "computer-centre-hours",
    tag_slug: "wifi",
    question: "Where is the Computer Centre? What are its hours?",
    answer: "The central Computer Centre is situated in the main academic building. It houses high-end computer labs with internet connectivity. It is open during working hours (typically 9:00 AM to 5:30 PM, with extended hours during exams) for programming, online exams, and academic research.",
    order_index: 20,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
  },
  {
    id: "fallback-q18",
    slug: "opensource-nitj-join",
    tag_slug: "clubs",
    question: "What is OpenSource @ NITJ? How do I join?",
    answer: "OpenSource @ NITJ is the student-led open-source developer community at NIT Jalandhar. We build real-world software for the campus, organize hackathons, and run mentorship programs for GSoC, LFX, and dev roles. You can get involved by contributing to our GitHub repositories, joining our Discord server, and participating in our regular code sprints!",
    order_index: 10,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
  },
  {
    id: "fallback-q19",
    slug: "other-clubs-on-campus",
    tag_slug: "clubs",
    question: "What other clubs exist on campus?",
    answer: "NITJ has a vibrant club culture: Technical clubs like CSI, IEEE, SAE (automotive), and RTIST (robotics); Cultural clubs like Raag (music), Nrityangana (dance), Rajbhasha Samiti (Hindi), LADS (literary & debating), and the Dramatics Club; along with social clubs like NSS and NCC.",
    order_index: 20,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
  },
];

export function clearFaqCache(): void {
  faqGlobal.faqMemoryCache = null;
  try {
    if (fs.existsSync(CACHE_PATH)) {
      fs.unlinkSync(CACHE_PATH);
    }
  } catch (e) {
    console.warn("Failed to clear FAQ file cache:", e);
  }
}
