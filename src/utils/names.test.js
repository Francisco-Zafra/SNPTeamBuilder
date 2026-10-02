import { describe, expect, it } from "vitest";
import { compactName, mediumName, shortName, uniqueShortNames } from "./names.js";

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

describe("alias", () => {
  it("si hay alias, todos los formatos lo usan", () => {
    const fran = { name: "Fran", alias: "Fran", firstName: "Francisco", lastName: "Zafra Del Moral" };
    expect(shortName(fran)).toBe("Fran");
    expect(mediumName(fran)).toBe("Fran");
    expect(compactName(fran)).toBe("Fran");
  });
});

describe("uniqueShortNames", () => {
  it("alias o nombre de pila; inicial solo si dos coinciden", () => {
    const names = uniqueShortNames([
      { id: "1", name: "Fran", alias: "Fran", firstName: "Francisco", lastName: "Zafra Del Moral" },
      { id: "2", name: "David Gerardo Trujillo Vasquez", firstName: "David Gerardo", lastName: "Trujillo Vasquez" },
      { id: "3", name: "Javier Hurtado Martin", firstName: "Javier", lastName: "Hurtado Martin" },
      { id: "4", name: "Javier Ruiz Lopez", firstName: "Javier", lastName: "Ruiz Lopez" },
    ]);
    expect([...names.values()]).toEqual(["Fran", "David", "Javier H.", "Javier R."]);
  });
});

describe("mediumName", () => {
  it("usa el primer nombre y el primer apellido", () => {
    expect(mediumName(daniel)).toBe("Daniel García");
    expect(mediumName({ name: "Curci", firstName: "", lastName: "Curci" })).toBe("Curci");
  });
});

describe("compactName", () => {
  it("usa el primer nombre y la inicial del apellido", () => {
    expect(compactName(daniel)).toBe("Daniel G.");
    expect(compactName({ name: "Javier Hurtado Martin", firstName: "Javier", lastName: "Hurtado Martin" })).toBe("Javier H.");
    expect(compactName({ name: "Javier Ruiz Lopez", firstName: "Javier", lastName: "Ruiz Lopez" })).toBe("Javier R.");
  });

  it("tolera nombres o apellidos vacíos", () => {
    expect(compactName({ name: "Curci", firstName: "", lastName: "Curci" })).toBe("Curci");
    expect(compactName({ name: "Pep", firstName: "Pep", lastName: "" })).toBe("Pep");
  });
});
