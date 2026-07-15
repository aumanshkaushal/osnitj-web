import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Error: DATABASE_URL environment variable is not defined.");
  process.exit(1);
}

const FAQ_TAGS = [
  { slug: "hostels", label: "Hostels & Mess", icon: "Home" },
  { slug: "academics", label: "Academics", icon: "BookOpen" },
  { slug: "general", label: "Campus & Logistics", icon: "Compass" },
  { slug: "wifi", label: "Wi-Fi & IT", icon: "Wifi" },
  { slug: "clubs", label: "Clubs & Tech", icon: "Users" },
];

const FAQ_QUESTIONS = [
  {
    tag_slug: "hostels",
    question: "Which hostels are allotted to first-year students?",
    answer: "First-year boys are typically allotted BH-1, BH-2, or specific blocks of the Mega Hostels. First-year girls are accommodated in GH-1 or the Mega Girls Hostel. The specific allotment details are updated during the physical reporting period on the official institute portal. Room sharing is usually double or triple occupancy for freshers.",
    order_index: 10,
  },
  {
    tag_slug: "hostels",
    question: "What is the Online Hostel Allotment Process (OHAP)?",
    answer: "OHAP is the online portal (usually at ha.nitj.ac.in) used to select rooms and pay hostel and mess advances. You will need to upload your institute admission fee receipt and fill in your preferences. Make sure to complete the payment within the deadline to secure your room. Please note: Local students residing within a 30 km radius of Jalandhar city are generally not eligible for hostels.",
    order_index: 20,
  },
  {
    tag_slug: "hostels",
    question: "How is the mess food? Can we change our mess?",
    answer: "Hostels have student-run or contractor-managed messes. The menu is decided by the student mess committee and updated monthly to ensure a variety of nutritious meals. If you are unsatisfied with the quality or service, complaints can be registered with the hostel warden or mess manager. Generally, you cannot change messes mid-semester unless you are shifted to another hostel.",
    order_index: 30,
  },
  {
    tag_slug: "hostels",
    question: "What are the hostel curfew timings?",
    answer: "First-year hostels have strict curfew timings for safety and discipline. Currently, the curfew is usually 9:30 PM or 10:00 PM for boys and 7:00 PM or 8:00 PM for girls. Biometric or register attendance is recorded every night. Curfew timings are relaxed slightly in the subsequent years.",
    order_index: 40,
  },
  {
    tag_slug: "hostels",
    question: "Can we use electric kettles, room heaters, or irons in our rooms?",
    answer: "No, high-power electrical appliances are strictly prohibited in hostel rooms due to safety guidelines and electricity load constraints. Using them can result in confiscation of the appliance and a fine.",
    order_index: 55,
  },
  {
    tag_slug: "hostels",
    question: "Where do I buy room essentials (buckets, mattress, pillows)?",
    answer: "The campus shopping complexes (located near Hostel 1/2 and Mega Hostels) have dedicated shops that sell mattresses, pillows, buckets, mugs, bedsheets, and basic toiletries. During registration days, temporary vendors also set up stalls on campus, making it easy to buy everything locally.",
    order_index: 60,
  },
  {
    tag_slug: "academics",
    question: "What is the 75% attendance rule? Is it strictly enforced?",
    answer: "Yes, NIT Jalandhar strictly enforces a minimum of 75% attendance in both lectures and practical classes. Falling below this threshold without valid medical reasons (approved by the HOD) will result in being detrained (Grade 'W' or 'F'), meaning you will not be allowed to sit for the end-semester examinations.",
    order_index: 10,
  },
  {
    tag_slug: "academics",
    question: "How is the grading system structured?",
    answer: "The institute uses a 10-point CGPA grading scale. Grades range from 'S' (Outstanding, 10 points), 'A' (Excellent, 9 points), 'B' (Very Good, 8 points), 'C' (Good, 7 points), 'D' (Fair, 6 points), down to 'E' (Marginal, 4 points) and 'F' (Fail, 0 points). Continuous assessment includes two Minor Exams, Class Quizzes/Assignments, and one Major Exam per semester.",
    order_index: 20,
  },
  {
    tag_slug: "academics",
    question: "Can I change my branch after the first year?",
    answer: "Yes, branch change is allowed at the end of the first year (after the 2nd semester). It is strictly merit-based, depending on your CGPA (usually requires a CGPA > 8.0 or 8.5 with no backlogs). The availability of vacant seats in the target branch also plays a major role, and the change is finalized as per Senate rules.",
    order_index: 30,
  },
  {
    tag_slug: "academics",
    question: "What happens if I fail a course (get an 'F' grade)?",
    answer: "If you fail a course, you must clear it by writing a re-appear examination (conducted in subsequent semesters) or registering for the course again in the summer semester (if offered). It is highly recommended to clear backlogs as early as possible to avoid placement restrictions in final years.",
    order_index: 40,
  },
  {
    tag_slug: "general",
    question: "How do I reach the NIT Jalandhar campus?",
    answer: "The campus is located on the Jalandhar-Amritsar highway (GT Road Bypass). From Jalandhar City Railway Station (JUC), it is ~12 km, and from Jalandhar Cantt Railway Station (JRC), it is ~16 km. Auto-rickshaws (sharing or private) and cabs are readily available from both stations. Amritsar Airport (ATQ) is about 80 km away, with direct buses and cabs available to Jalandhar.",
    order_index: 10,
  },
  {
    tag_slug: "general",
    question: "Are cycles allowed on campus? Do I need one?",
    answer: "Yes, bicycles are highly recommended and widely used by students. The campus is vast (around 154 acres), and walking from the Mega Hostels to the academic blocks or central library takes 12–15 minutes. Please note: Motorized two-wheelers (motorcycles, scooters) and cars are strictly prohibited for hostel residents.",
    order_index: 20,
  },
  {
    tag_slug: "general",
    question: "What medical facilities are available on campus?",
    answer: "The campus has a dedicated Dispensary with resident doctors, nursing staff, and basic medicines available free of cost for students. For emergencies, an ambulance is available 24/7 to transport students to major hospitals in Jalandhar city.",
    order_index: 30,
  },
  {
    tag_slug: "general",
    question: "Where can I print documents or buy stationery?",
    answer: "Stationery shops are located inside the campus shopping complexes and near the main academic blocks. They offer printing, photocopying, spiral binding, academic supplies, and notebook essentials at standard student rates.",
    order_index: 40,
  },
  {
    tag_slug: "general",
    question: "What is the dress code for classes and labs?",
    answer: "There is no formal dress code for daily lectures, but decent and appropriate casual wear is expected. However, for laboratory sessions, workshops, formal presentations, and placement events, you must wear formal attire (or lab coats/safety shoes as specified by the respective department).",
    order_index: 50,
  },
  {
    tag_slug: "wifi",
    question: "How do I get Wi-Fi or LAN credentials?",
    answer: "Every student is provided with a unique login ID and password for internet access. You must submit a Wi-Fi registration form (available at the Computer Centre website or office) along with your MAC address to register your devices (laptops and phones) on the campus network.",
    order_index: 10,
  },
  {
    tag_slug: "wifi",
    question: "Where is the Computer Centre? What are its hours?",
    answer: "The central Computer Centre is situated in the main academic building. It houses high-end computer labs with internet connectivity. It is open during working hours (typically 9:00 AM to 5:30 PM, with extended hours during exams) for programming, online exams, and academic research.",
    order_index: 20,
  },
  {
    tag_slug: "clubs",
    question: "What is OpenSource @ NITJ? How do I join?",
    answer: "OpenSource @ NITJ is the student-led open-source developer community at NIT Jalandhar. We build real-world software for the campus, organize hackathons, and run mentorship programs for GSoC, LFX, and dev roles. You can get involved by contributing to our GitHub repositories, joining our Discord server, and participating in our regular code sprints!",
    order_index: 10,
  },
  {
    tag_slug: "clubs",
    question: "What other clubs exist on campus?",
    answer: "NITJ has a vibrant club culture: Technical clubs like CSI, IEEE, SAE (automotive), and RTIST (robotics); Cultural clubs like Raag (music), Nrityangana (dance), Rajbhasha Samiti (Hindi), LADS (literary & debating), and the Dramatics Club; along with social clubs like NSS and NCC.",
    order_index: 20,
  },
];

async function main() {
  console.log("Connecting to database...");
  const sql = postgres(connectionString!, {
    ssl: "require",
    max: 1,
    prepare: false,
  });

  try {
    console.log("Creating faq_tags table...");
    await sql`
      create table if not exists public.faq_tags (
        id uuid primary key default gen_random_uuid(),
        slug text not null unique,
        label text not null,
        icon text not null,
        created_at timestamptz not null default now()
      );
    `;

    console.log("Creating faq_questions table...");
    await sql`
      create table if not exists public.faq_questions (
        id uuid primary key default gen_random_uuid(),
        tag_slug text not null references public.faq_tags(slug) on delete cascade,
        question text not null,
        answer text not null,
        order_index integer not null default 0,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    `;

    console.log("Seeding FAQ tags...");
    for (const tag of FAQ_TAGS) {
      await sql`
        insert into public.faq_tags (slug, label, icon)
        values (${tag.slug}, ${tag.label}, ${tag.icon})
        on conflict (slug) do update
        set label = excluded.label, icon = excluded.icon;
      `;
    }

    console.log("Seeding FAQ questions...");
    for (const q of FAQ_QUESTIONS) {
      // Check if question already exists to prevent duplicate seeding
      const existing = await sql`
        select id from public.faq_questions
        where tag_slug = ${q.tag_slug} and question = ${q.question}
        limit 1;
      `;
      if (existing.length === 0) {
        await sql`
          insert into public.faq_questions (tag_slug, question, answer, order_index)
          values (${q.tag_slug}, ${q.question}, ${q.answer}, ${q.order_index});
        `;
      }
    }

    console.log("FAQ schema created and seeded successfully!");
  } catch (error) {
    console.error("Error during database operations:", error);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
