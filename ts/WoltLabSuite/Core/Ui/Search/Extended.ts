import { dboAction } from "../../Ajax";
import DatePicker from "../../Date/Picker";
import * as DomUtil from "../../Dom/Util";
import { ucfirst } from "../../StringUtil";
import UiPagination from "../Pagination";
import UiSearchInput from "./Input";

type ResponseSearch = {
  count: number;
  title: string;
  pages?: number;
  searchID?: number;
  template?: string;
};

type ResponseSearchResults = {
  template: string;
};

export class UiSearchExtended {
  private readonly form: HTMLFormElement;
  private readonly queryInput: HTMLInputElement;
  private readonly typeInput: HTMLSelectElement;
  private readonly usernameInput: HTMLInputElement;
  private searchID: number | undefined;
  private pages = 0;
  private activePage = 1;
  private lastSearchRequest: AbortController | undefined = undefined;
  private lastSearchResultRequest: AbortController | undefined = undefined;

  constructor() {
    this.form = document.getElementById("extendedSearchForm") as HTMLFormElement;
    this.queryInput = document.getElementById("searchQuery") as HTMLInputElement;
    this.typeInput = document.getElementById("searchType") as HTMLSelectElement;
    this.usernameInput = document.getElementById("searchAuthor") as HTMLInputElement;

    this.initEventListener();
    this.initKeywordSuggestions();
    this.initQueryString();
  }

  private initEventListener(): void {
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.search();
    });
    this.typeInput.addEventListener("change", () => this.changeType());
  }

  private initKeywordSuggestions(): void {
    new UiSearchInput(this.queryInput, {
      ajax: {
        className: "wcf\\data\\search\\keyword\\SearchKeywordAction",
      },
    });
  }

  private changeType(): void {
    document.querySelectorAll(".objectTypeSearchFilters").forEach((filter: HTMLElement) => {
      filter.hidden = filter.dataset.objectType !== this.typeInput.value;
    });
  }

  private async search(): Promise<void> {
    if (!this.queryInput.value.trim() && !this.usernameInput.value.trim()) {
      return;
    }

    this.updateQueryString();

    if (this.lastSearchRequest) {
      this.lastSearchRequest.abort();
    }
    const request = dboAction("search", "wcf\\data\\search\\SearchAction").payload(this.getFormData());
    this.lastSearchRequest = request.getAbortController();
    const { count, searchID, title, pages, template } = (await request.dispatch()) as ResponseSearch;
    document.querySelector(".contentTitle")!.textContent = title;
    this.searchID = searchID;
    this.activePage = 1;

    this.removeSearchResults();

    if (count > 0) {
      this.pages = pages!;
      this.showSearchResults(template!);
    }
  }

  private updateQueryString(): void {
    const url = new URL(this.form.action);

    new FormData(this.form).forEach((value, key) => {
      if (value.toString()) {
        url.search += url.search !== "" ? "&" : "?";
        url.search += encodeURIComponent(key) + "=" + encodeURIComponent(value.toString());
      }
    });

    window.history.replaceState({}, document.title, url.toString());
  }

  private getFormData(): Record<string, unknown> {
    const data = {};
    new FormData(this.form).forEach((value, key) => {
      if (value.toString()) {
        data[key] = value;
      }
    });

    return data;
  }

  private initQueryString(): void {
    const url = new URL(window.location.href);
    url.searchParams.forEach((value, key) => {
      let element = this.form.elements[key] as HTMLElement;
      if (value && element) {
        if (element instanceof RadioNodeList) {
          let id = "";
          element.forEach((childElement: HTMLElement) => {
            if (childElement.classList.contains("inputDatePicker")) {
              id = childElement.id;
            }
          });
          if (id) {
            DatePicker.setDate(id, new Date(value));
          }
        } else if (element instanceof HTMLInputElement) {
          if (element.type === "checkbox") {
            element.checked = true;
          } else {
            element.value = value;
          }
        } else if (element instanceof HTMLSelectElement) {
          element.value = value;
        }
      }
    });

    this.typeInput.dispatchEvent(new Event("change"));
    this.search();
  }

  private initPagination(position: "top" | "bottom"): void {
    const wrapperDiv = document.createElement("div");
    wrapperDiv.classList.add("pagination" + ucfirst(position));
    this.form.parentElement!.appendChild(wrapperDiv);
    const div = document.createElement("div");
    wrapperDiv.appendChild(div);

    new UiPagination(div, {
      activePage: this.activePage,
      maxPage: this.pages,

      callbackSwitch: (pageNo) => {
        this.changePage(pageNo);
      },
    });
  }

  private async changePage(pageNo: number): Promise<void> {
    if (this.lastSearchResultRequest) {
      this.lastSearchResultRequest.abort();
    }

    const request = dboAction("getSearchResults", "wcf\\data\\search\\SearchAction").payload({
      searchID: this.searchID,
      pageNo,
    });
    this.lastSearchResultRequest = request.getAbortController();
    const { template } = (await request.dispatch()) as ResponseSearchResults;
    this.activePage = pageNo;
    this.removeSearchResults();
    this.showSearchResults(template);
  }

  private removeSearchResults(): void {
    while (this.form.nextSibling !== null) {
      this.form.parentElement!.removeChild(this.form.nextSibling);
    }
  }

  private showSearchResults(template: string): void {
    if (this.pages > 1) {
      this.initPagination("top");
    }

    const fragment = DomUtil.createFragmentFromHtml(template!);
    this.form.parentElement!.appendChild(fragment);

    if (this.pages > 1) {
      this.initPagination("bottom");
    }
  }
}

export default UiSearchExtended;
