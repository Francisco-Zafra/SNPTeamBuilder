import { describe, expect, it } from "vitest";
import { compactName, shortName } from "./names.js";

const daniel = {
  name: "Daniel Eliot Lolani García Fernandez",
  firstName: "Daniel Eliot Lolani",
  lastName: "García Fernandez",
};

describe("shortName", () => {
  it("usa el primer nombre y los apellidos", () => {
    expect(shortName(daniel)).toBe("Daniel García Fernandez");
    expect(shortName({ name: "Mauro Stopiello", firstName: "Mauro", lastName: "Stopiello" })).toBe(
      "Mauro Stopiello"
    );
  });

  it("recurre al nombre completo si faltan partes", () => {
    expect(shortName({ name: "X", firstName: "", lastName: "" })).toBe("X");
  });
});

describe("compactName", () => {
  it("usa la inicial y el primer apellido", () => {
    expect(compactName(daniel)).toBe("D. García");
  });

  it("tolera nombres o apellidos vacíos", () => {
    expect(compactName({ name: "Curci", firstName: "", lastName: "Curci" })).toBe("Curci");
    expect(compactName({ name: "Pep", firstName: "Pep", lastName: "" })).toBe("Pep");
  });
});
