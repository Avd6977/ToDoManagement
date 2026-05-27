import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { Toaster } from "src/components/Toaster/Toaster";
import { toasterMessageService } from "src/services/toasterMessageService";

afterEach(() => {
  toasterMessageService.clear();
});

describe("Toaster", () => {
  it("renders and dismisses an error message", async () => {
    const user = userEvent.setup();

    render(<Toaster />);

    toasterMessageService.showError("Something went wrong");
    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dismiss message" }));
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });
});
