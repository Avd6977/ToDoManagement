import axios from "axios";

const args = process.argv.slice(2);

const parseArgs = (argv) => {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith("--")) {
      continue;
    }

    const key = current.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = "true";
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
};

const options = parseArgs(args);

const email = options.email;
const password = options.password;
const fullName = options.fullName ?? "Task Seeder";
const apiBaseUrl = options.apiBaseUrl ?? "http://localhost:5000/api";
const count = Number(options.count ?? "100");
const startAt = Number(options.startAt ?? "1");
const prefix = options.prefix ?? "Task";
const shouldRegister = options.register === "true";

const printUsageAndExit = () => {
  console.error("Usage: npm run seed:tasks -- --email <email> --password <password> [--count 100] [--startAt 1] [--prefix Task] [--apiBaseUrl http://localhost:5000/api] [--register true] [--fullName \"Task Seeder\"]");
  process.exit(1);
};

if (!email || !password || Number.isNaN(count) || Number.isNaN(startAt) || count < 1 || startAt < 1) {
  printUsageAndExit();
}

const apiClient = axios.create({ baseURL: apiBaseUrl, timeout: 15000 });

const login = async () => {
  const response = await apiClient.post("/auth/login", {
    username: email,
    password,
  });

  return response.data?.token;
};

const register = async () => {
  const response = await apiClient.post("/auth/register", {
    fullName,
    username: email,
    password,
  });

  return response.data?.token;
};

const getAccessToken = async () => {
  try {
    const token = await login();
    if (!token) {
      throw new Error("Login succeeded but no token was returned.");
    }

    return token;
  } catch (error) {
    if (!shouldRegister) {
      throw error;
    }

    const registeredToken = await register();
    if (!registeredToken) {
      throw new Error("Registration succeeded but no token was returned.");
    }

    return registeredToken;
  }
};

const createTaskDescription = (prefixValue, numericValue) => `${prefixValue} ${String(numericValue).padStart(3, "0")}`;

const seedTasks = async () => {
  const token = await getAccessToken();

  for (let index = 0; index < count; index += 1) {
    const taskNumber = startAt + index;
    const description = createTaskDescription(prefix, taskNumber);

    await apiClient.post(
      "/tasks",
      {
        description,
        dueDate: null,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if ((index + 1) % 25 === 0 || index + 1 === count) {
      console.log(`Created ${index + 1}/${count} tasks.`);
    }
  }
};

seedTasks()
  .then(() => {
    console.log(`Done. Seeded ${count} tasks starting at ${startAt}.`);
  })
  .catch((error) => {
    const message = error?.response?.data?.message ?? error?.message ?? "Unknown error";
    console.error(`Task seeding failed: ${message}`);
    process.exit(1);
  });
