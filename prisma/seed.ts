import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const FOUNDATIONS_COURSE_NAME = "IoT Foundations";
const SURPRISESELL_TENANT_SLUG = "surprisesell";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  // --- Public SurpriseSell tenant (consumer signups) -------------------------
  const surprisesell = await prisma.university.upsert({
    where: { slug: SURPRISESELL_TENANT_SLUG },
    update: { name: "SurpriseSell", status: "ACTIVE" },
    create: {
      name: "SurpriseSell",
      slug: SURPRISESELL_TENANT_SLUG,
      status: "ACTIVE",
      subscription: { create: { plan: "platform", seats: 100000, status: "active" } },
    },
  });

  let ssDept = await prisma.department.findFirst({
    where: { universityId: surprisesell.id, name: "Public Learning" },
  });
  if (!ssDept) {
    ssDept = await prisma.department.create({
      data: { name: "Public Learning", universityId: surprisesell.id },
    });
  }

  const ssInstructor = await prisma.user.upsert({
    where: { email: "instructor@surprisesell.com" },
    update: {},
    create: {
      email: "instructor@surprisesell.com",
      passwordHash,
      firstName: "Alex",
      lastName: "Rivera",
      role: Role.INSTRUCTOR,
      universityId: surprisesell.id,
    },
  });

  async function ensureCourse(data: {
    name: string;
    description: string;
    difficulty: string;
    durationWeeks?: number;
  }) {
    const existing = await prisma.course.findFirst({
      where: { universityId: surprisesell.id, name: data.name },
    });
    if (existing) return existing;
    return prisma.course.create({
      data: {
        name: data.name,
        description: data.description,
        difficulty: data.difficulty,
        durationWeeks: data.durationWeeks ?? 6,
        universityId: surprisesell.id,
        departmentId: ssDept!.id,
        instructorId: ssInstructor.id,
      },
    });
  }

  const foundations = await ensureCourse({
    name: FOUNDATIONS_COURSE_NAME,
    description:
      "Start here: sensors, microcontrollers, and your first Virtual Lab circuits. Free for every SurpriseSell account.",
    difficulty: "Beginner",
    durationWeeks: 4,
  });

  const sensorsCourse = await ensureCourse({
    name: "Sensors & Actuators",
    description: "Build temperature, motion, and lighting projects with ESP32 kits.",
    difficulty: "Beginner",
  });

  const cloudCourse = await ensureCourse({
    name: "Cloud-Connected Devices",
    description: "MQTT topics, dashboards, and connecting firmware to the cloud.",
    difficulty: "Intermediate",
  });

  const experimentSpecs = [
    {
      name: "LED Blink Foundations",
      description: "Control an LED from the Virtual Lab.",
      courseId: foundations.id,
      components: ["ESP32", "LED"],
    },
    {
      name: "Temperature Alert",
      description: "Read a temperature sensor and light an LED above threshold.",
      courseId: sensorsCourse.id,
      components: ["ESP32", "TEMP_SENSOR", "LED"],
    },
    {
      name: "Motion Alarm",
      description: "Trigger an alert when a PIR sensor detects motion.",
      courseId: cloudCourse.id,
      components: ["ESP32", "PIR", "BUZZER"],
    },
  ];

  for (const e of experimentSpecs) {
    const exists = await prisma.experiment.findFirst({
      where: { courseId: e.courseId, name: e.name },
    });
    if (exists) continue;
    await prisma.experiment.create({
      data: {
        name: e.name,
        description: e.description,
        learningObjectives: `Complete the "${e.name}" lab in simulation, then try it on a rented or purchased kit.`,
        componentsRequired: e.components,
        instructions: `Build "${e.name}" in the Virtual Lab, write control logic, and run the simulation.`,
        starterCode: `// ${e.name}\nvoid setup() {\n  pinMode(LED_PIN, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(LED_PIN, HIGH);\n  delay(500);\n  digitalWrite(LED_PIN, LOW);\n  delay(500);\n}`,
        expectedResult: "Circuit behaves according to the experiment instructions.",
        timeLimitMinutes: 60,
        courseId: e.courseId,
        instructorId: ssInstructor.id,
      },
    });
  }

  const assignmentExists = await prisma.assignment.findFirst({
    where: { courseId: foundations.id, title: "First Circuit Challenge" },
  });
  if (!assignmentExists) {
    const ledExp = await prisma.experiment.findFirst({
      where: { courseId: foundations.id, name: "LED Blink Foundations" },
    });
    await prisma.assignment.create({
      data: {
        title: "First Circuit Challenge",
        instructions: "Build an LED blink circuit in the Virtual Lab and submit your simulation.",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        requiredComponents: ["ESP32", "LED"],
        gradingCriteria: [
          { label: "ESP32 present", points: 30 },
          { label: "LED connected", points: 30 },
          { label: "Simulation passes", points: 40 },
        ],
        maxScore: 100,
        courseId: foundations.id,
        experimentId: ledExp?.id,
      },
    });
  }

  const catalog = [
    {
      slug: "esp32-starter-kit",
      name: "ESP32 Starter Kit",
      description:
        "ESP32 board, breadboard, LEDs, resistors, and jumper wires. Ideal for IoT Foundations.",
      priceCents: 4999,
      rentPriceCents: 1999,
      depositCents: 3000,
      rentalDays: 14,
      stock: 40,
      type: "BOTH" as const,
      courseId: foundations.id,
    },
    {
      slug: "sensor-explorer-kit",
      name: "Sensor Explorer Kit",
      description:
        "Temperature, PIR, light sensors, and a buzzer for intermediate experiments.",
      priceCents: 6999,
      rentPriceCents: 2499,
      depositCents: 4000,
      rentalDays: 21,
      stock: 25,
      type: "BOTH" as const,
      courseId: sensorsCourse.id,
    },
    {
      slug: "mqtt-lab-kit",
      name: "MQTT Lab Kit",
      description: "ESP32 plus sensors geared toward cloud and dashboard projects.",
      priceCents: 8999,
      rentPriceCents: 2999,
      depositCents: 5000,
      rentalDays: 21,
      stock: 15,
      type: "BOTH" as const,
      courseId: cloudCourse.id,
    },
    {
      slug: "esp32-dev-board",
      name: "ESP32 Dev Board (buy only)",
      description: "Bare ESP32 development board for builders who already have sensors.",
      priceCents: 1499,
      rentPriceCents: null,
      depositCents: null,
      rentalDays: 14,
      stock: 100,
      type: "BUYABLE" as const,
      courseId: foundations.id,
    },
  ];

  for (const p of catalog) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        rentPriceCents: p.rentPriceCents,
        depositCents: p.depositCents,
        rentalDays: p.rentalDays,
        stock: p.stock,
        type: p.type,
        courseId: p.courseId,
        active: true,
      },
      create: p,
    });
  }

  // --- Example University (demo dashboards) ----------------------------------
  const university = await prisma.university.upsert({
    where: { slug: "example-university" },
    update: {},
    create: {
      name: "Example University",
      slug: "example-university",
      status: "ACTIVE",
      subscription: { create: { plan: "standard", seats: 200, status: "active" } },
    },
  });

  let dept = await prisma.department.findFirst({
    where: { universityId: university.id, name: "Computer Science & Engineering" },
  });
  if (!dept) {
    dept = await prisma.department.create({
      data: { name: "Computer Science & Engineering", universityId: university.id },
    });
  }

  await prisma.user.upsert({
    where: { email: "admin@iotlab.dev" },
    update: {},
    create: {
      email: "admin@iotlab.dev",
      passwordHash,
      firstName: "Platform",
      lastName: "Admin",
      role: Role.PLATFORM_ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "uadmin@example.edu" },
    update: {},
    create: {
      email: "uadmin@example.edu",
      passwordHash,
      firstName: "Dana",
      lastName: "Whitfield",
      role: Role.UNIVERSITY_ADMIN,
      universityId: university.id,
    },
  });

  const instructor1 = await prisma.user.upsert({
    where: { email: "instructor1@example.edu" },
    update: {},
    create: {
      email: "instructor1@example.edu",
      passwordHash,
      firstName: "Maria",
      lastName: "Chen",
      role: Role.INSTRUCTOR,
      universityId: university.id,
    },
  });

  const instructor2 = await prisma.user.upsert({
    where: { email: "instructor2@example.edu" },
    update: {},
    create: {
      email: "instructor2@example.edu",
      passwordHash,
      firstName: "Samuel",
      lastName: "Osei",
      role: Role.INSTRUCTOR,
      universityId: university.id,
    },
  });

  const students = [];
  const studentNames = [
    ["Ava", "Martinez"],
    ["Liam", "Johnson"],
    ["Noah", "Williams"],
    ["Emma", "Brown"],
    ["Olivia", "Davis"],
    ["Ethan", "Miller"],
    ["Sophia", "Wilson"],
    ["Mason", "Moore"],
    ["Isabella", "Taylor"],
    ["Lucas", "Anderson"],
  ];
  for (let i = 0; i < studentNames.length; i++) {
    const [firstName, lastName] = studentNames[i];
    const student = await prisma.user.upsert({
      where: { email: `student${i + 1}@example.edu` },
      update: {},
      create: {
        email: `student${i + 1}@example.edu`,
        passwordHash,
        firstName,
        lastName,
        role: Role.STUDENT,
        universityId: university.id,
      },
    });
    students.push(student);
  }

  let courses = await prisma.course.findMany({
    where: { universityId: university.id },
    orderBy: { createdAt: "asc" },
  });
  if (courses.length === 0) {
    const courseData = [
      {
        name: "Introduction to IoT",
        description: "Foundations of sensors, microcontrollers, and connected devices.",
        difficulty: "Beginner",
        instructor: instructor1,
      },
      {
        name: "Cloud IoT",
        description: "MQTT, AWS IoT Core, and cloud-connected device architectures.",
        difficulty: "Intermediate",
        instructor: instructor2,
      },
      {
        name: "Embedded Systems",
        description: "Firmware, GPIO, and real-time constraints on microcontrollers.",
        difficulty: "Advanced",
        instructor: instructor1,
      },
    ];
    for (const c of courseData) {
      const course = await prisma.course.create({
        data: {
          name: c.name,
          description: c.description,
          difficulty: c.difficulty,
          durationWeeks: 10,
          universityId: university.id,
          departmentId: dept.id,
          instructorId: c.instructor.id,
        },
      });
      courses.push(course);
    }
  }

  for (const [i, student] of students.entries()) {
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: student.id, courseId: courses[0].id } },
      update: {},
      create: { studentId: student.id, courseId: courses[0].id, progress: 30 + (i * 5) % 60 },
    });
    if (i % 2 === 0 && courses[1]) {
      await prisma.enrollment.upsert({
        where: { studentId_courseId: { studentId: student.id, courseId: courses[1].id } },
        update: {},
        create: { studentId: student.id, courseId: courses[1].id, progress: 10 + (i * 7) % 50 },
      });
    }
  }

  for (const id of ["ESP32-001", "ESP32-002", "ESP32-003"]) {
    await prisma.device.upsert({
      where: { deviceId: id },
      update: {},
      create: {
        deviceId: id,
        universityId: university.id,
        labLocation: "IoT Lab — Room 214",
        status: "AVAILABLE",
        firmwareVersion: "1.0.0",
      },
    });
  }

  console.log("Seed complete.");
  console.log("Public tenant:", SURPRISESELL_TENANT_SLUG);
  console.log("Catalog kits:", catalog.map((c) => c.slug).join(", "));
  console.log("Login as:");
  console.log("  Platform admin: admin@iotlab.dev / Password123!");
  console.log("  University admin: uadmin@example.edu / Password123!");
  console.log("  Instructor: instructor1@example.edu / Password123!");
  console.log("  Student: student1@example.edu / Password123!");
  console.log("  SurpriseSell instructor: instructor@surprisesell.com / Password123!");
  console.log("Or create a public account at /signup");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
