import axios from "axios";

const args = process.argv.slice(2);
const positionalArgs = args.filter((value) => !value.startsWith("--"));
const hasNamedArgs = args.some((value) => value.startsWith("--"));

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
const positional = hasNamedArgs ? [] : positionalArgs;

const email = options.email ?? positional[0];
const password = options.password ?? positional[1];
const fullName = options.fullName ?? options.full_name ?? "Task Seeder";
const apiBaseUrl = options.apiBaseUrl ?? options.api_base_url ?? positional[5] ?? "http://localhost:5000/api";
const count = Number(options.count ?? positional[2] ?? "100");
const startAt = Number(options.startAt ?? options.start_at ?? positional[3] ?? "1");
const taskPrefix = options.taskPrefix ?? options.task_prefix ?? options.prefix ?? positional[4] ?? "Task";
const shouldRegister = (options.register ?? positional[6] ?? "true") === "true";

const printUsageAndExit = () => {
  console.error("Usage: npm run seed:tasks -- --email <email> --password <password> [--count 100] [--startAt 1] [--taskPrefix Task] [--apiBaseUrl http://localhost:5000/api] [--register true] [--fullName \"Task Seeder\"]");
  process.exit(1);
};

if (!email || !password || Number.isNaN(count) || Number.isNaN(startAt) || count < 1 || startAt < 1) {
  printUsageAndExit();
}

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  withCredentials: true,
});

const toCookieHeader = (setCookieHeader) => {
  if (!setCookieHeader) {
    return "";
  }

  const values = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];

  return values
    .map((value) => String(value).split(";")[0])
    .filter(Boolean)
    .join("; ");
};

const login = async () => {
  const response = await apiClient.post("/auth/login", {
    username: email,
    password,
  });

  return toCookieHeader(response.headers?.["set-cookie"]);
};

const register = async () => {
  const response = await apiClient.post("/auth/register", {
    fullName,
    username: email,
    password,
  });

  return toCookieHeader(response.headers?.["set-cookie"]);
};

const ensureAuthenticated = async () => {
  try {
    const loginCookie = await login();
    if (!loginCookie) {
      throw new Error("Login succeeded but no auth cookies were returned.");
    }

    return loginCookie;
  } catch (error) {
    if (!shouldRegister) {
      throw error;
    }

    await register();
    const loginCookie = await login();
    if (!loginCookie) {
      throw new Error("Login succeeded but no auth cookies were returned.");
    }

    return loginCookie;
  }
};

const createTaskDescription = (prefixValue, numericValue) => `${prefixValue} ${String(numericValue).padStart(3, "0")}`;

const seedTasks = async () => {
  const cookieHeader = await ensureAuthenticated();

  for (let index = 0; index < count; index += 1) {
    const taskNumber = startAt + index;
    const description = createTaskDescription(taskPrefix, taskNumber);

    await apiClient.post(
      "/tasks",
      {
        description,
        dueDate: null,
      },
      {
        headers: {
          Cookie: cookieHeader,
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
