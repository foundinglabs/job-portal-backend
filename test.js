const { createClient } = require("@supabase/supabase-js")
const supabase = createClient(
  "https://dgrqorfhwfmqzbvmulgb.supabase.co", // use your real URL here
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRncnFvcmZod2ZtcXpidm11bGdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcyNjIwMiwiZXhwIjoyMDY4MzAyMjAyfQ.rYFCYoq-Q8DZlkM7EcX_u--l3hbmUSLcp6iUVK7OBFw" // use your real service role key here
)

function getAllKeys(obj) {
  let keys = new Set()
  while (obj && obj !== Object.prototype) {
    Object.getOwnPropertyNames(obj).forEach((k) => keys.add(k))
    obj = Object.getPrototypeOf(obj)
  }
  return [...keys]
}

console.log(
  "SDK version:",
  require("@supabase/supabase-js/package.json").version
)
console.log("admin own keys:", Object.keys(supabase.auth.admin))
console.log("admin all keys:", getAllKeys(supabase.auth.admin))
;(async () => {
  try {
    const res = await supabase.auth.admin.getUserById(
      "4ad6cf91-49b6-4c70-a6be-000000000000"
    )
    console.log("getUserById result:", res)
  } catch (err) {
    console.error("getUserById error:", err)
  }
})()
