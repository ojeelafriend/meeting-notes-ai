import { App } from "../../../src/Api/http/express";
import database from "../../../src/Contexts/Shared/framework/database";

describe("⚡️", () => {
  it('Deberia devolver "Hello World" | GET /api ', async () => {
    const response = await fetch(`http://localhost:3030`);

    const result = await response.json();

    expect(result).toStrictEqual({ data: "Hello World!" });
  });
});
