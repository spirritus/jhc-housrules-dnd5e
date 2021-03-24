"use strict";

class PageFilterEquipment extends PageFilter {
	constructor () {
		super();

		this._typeFilter = new Filter({header: "Type", deselFn: (it) => PageFilterItems._DEFAULT_HIDDEN_TYPES.has(it), displayFn: StrUtil.toTitleCase});
		this._propertyFilter = new Filter({header: "Property", displayFn: StrUtil.uppercaseFirst});
		this._costFilter = new RangeFilter({header: "Cost", min: 0, max: 100, isAllowGreater: true, suffix: " gp"});
		this._weightFilter = new RangeFilter({header: "Weight", min: 0, max: 100, isAllowGreater: true, suffix: " lb."});
		this._focusFilter = new Filter({header: "Spellcasting Focus", items: [...Parser.ITEM_SPELLCASTING_FOCUS_CLASSES]});
		this._damageTypeFilter = new Filter({header: "Weapon Damage Type", displayFn: it => Parser.dmgTypeToFull(it).uppercaseFirst(), itemSortFn: (a, b) => SortUtil.ascSortLower(Parser.dmgTypeToFull(a), Parser.dmgTypeToFull(b))});
		this._miscFilter = new Filter({header: "Miscellaneous", items: ["Item Group", "SRD", "Has Images", "Has Info"], isSrdFilter: true});
		this._poisonTypeFilter = new Filter({header: "Poison Type", items: ["ingested", "injury", "inhaled", "contact"], displayFn: StrUtil.toTitleCase});
	}

	static mutateForFilters (item) {
		item._fProperties = item.property ? item.property.map(p => Renderer.item.propertyMap[p].name).filter(n => n) : [];

		item._fMisc = item.srd ? ["SRD"] : [];
		if (item._isItemGroup) item._fMisc.push("Item Group");
		if (item.hasFluff) item._fMisc.push("Has Info");
		if (item.hasFluffImages) item._fMisc.push("Has Images");

		if (item.focus || item.type === "INS" || item.type === "SCF") {
			item._fFocus = item.focus ? item.focus === true ? [...Parser.ITEM_SPELLCASTING_FOCUS_CLASSES] : [...item.focus] : [];
			if (item.type === "INS" && !item._fFocus.includes("Bard")) item._fFocus.push("Bard");
			if (item.type === "SCF") {
				switch (item.scfType) {
					case "arcane": {
						if (!item._fFocus.includes("Sorcerer")) item._fFocus.push("Sorcerer");
						if (!item._fFocus.includes("Warlock")) item._fFocus.push("Warlock");
						if (!item._fFocus.includes("Wizard")) item._fFocus.push("Wizard");
						break;
					}
					case "druid": {
						if (!item._fFocus.includes("Druid")) item._fFocus.push("Druid");
						break;
					}
					case "holy":
						if (!item._fFocus.includes("Cleric")) item._fFocus.push("Cleric");
						if (!item._fFocus.includes("Paladin")) item._fFocus.push("Paladin");
						break;
				}
			}
		}

		item._fValue = (item.value || 0) / 100;
	}

	addToFilters (item, isExcluded) {
		if (isExcluded) return;

		this._typeFilter.addItem(item._typeListText);
		this._propertyFilter.addItem(item._fProperties);
		this._damageTypeFilter.addItem(item.dmgType);
		this._poisonTypeFilter.addItem(item.poisonTypes);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._typeFilter,
			this._propertyFilter,
			this._costFilter,
			this._weightFilter,
			this._focusFilter,
			this._damageTypeFilter,
			this._miscFilter,
			this._poisonTypeFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it._typeListText,
			it._fProperties,
			it._fValue,
			it.weight,
			it._fFocus,
			it.dmgType,
			it._fMisc,
			it.poisonTypes,
		);
	}
}

class PageFilterItems extends PageFilterEquipment {
	// region static
	static _rarityValue (rarity) {
		switch (rarity) {
			case "none": return 0;
			case "common": return 1;
			case "uncommon": return 2;
			case "rare": return 3;
			case "very rare": return 4;
			case "legendary": return 5;
			case "artifact": return 6;
			case "varies": return 7;
			case "unknown (magic)": return 8;
			case "unknown": return 9;
			default: return 10;
		}
	}

	static sortItems (a, b, o) {
		if (o.sortBy === "name") return SortUtil.compareListNames(a, b);
		else if (o.sortBy === "type") return SortUtil.ascSortLower(a.values.type, b.values.type) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "source") return SortUtil.ascSortLower(a.values.source, b.values.source) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "rarity") return SortUtil.ascSort(PageFilterItems._rarityValue(a.values.rarity), PageFilterItems._rarityValue(b.values.rarity)) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "attunement") return SortUtil.ascSort(a.values.attunement, b.values.attunement) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "count") return SortUtil.ascSort(a.values.count, b.values.count) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "weight") return SortUtil.ascSort(a.values.weight, b.values.weight) || SortUtil.compareListNames(a, b);
		else if (o.sortBy === "cost") return SortUtil.ascSort(a.values.cost, b.values.cost) || SortUtil.compareListNames(a, b);
		else return 0;
	}

	// endregion
	constructor () {
		super();

		this._tierFilter = new Filter({header: "Tier", items: ["none", "minor", "major"], itemSortFn: null, displayFn: StrUtil.toTitleCase});
		this._attachedSpellsFilter = new Filter({header: "Attached Spells", displayFn: (it) => it.split("|")[0].toTitleCase(), itemSortFn: SortUtil.ascSortLower});
		this._lootTableFilter = new Filter({
			header: "Found On",
			items: ["Magic Item Table A", "Magic Item Table B", "Magic Item Table C", "Magic Item Table D", "Magic Item Table E", "Magic Item Table F", "Magic Item Table G", "Magic Item Table H", "Magic Item Table I"],
			displayFn: it => {
				const [name, sourceJson] = it.split("|");
				return `${name}${sourceJson ? ` (${Parser.sourceJsonToAbv(sourceJson)})` : ""}`
			},
		});
		this._rarityFilter = new Filter({
			header: "Rarity",
			items: [...Parser.ITEM_RARITIES],
			itemSortFn: null,
			displayFn: StrUtil.toTitleCase,
		});
		this._attunementFilter = new Filter({header: "Attunement", items: ["Requires Attunement", "Requires Attunement By...", "Attunement Optional", VeCt.STR_NO_ATTUNEMENT], itemSortFn: null});
		this._categoryFilter = new Filter({
			header: "Category",
			items: ["Basic", "Generic Variant", "Specific Variant", "Other"],
			deselFn: (it) => it === "Specific Variant",
			itemSortFn: null,
		});
		this._bonusFilter = new Filter({header: "Bonus", items: ["Armor Class", "Proficiency Bonus", "Spell Attacks", "Spell Save DC", "Saving Throws", "Weapon Attack and Damage Rolls", "Weapon Attack Rolls", "Weapon Damage Rolls"]});
		this._miscFilter = new Filter({header: "Miscellaneous", items: ["Ability Score Adjustment", "Charges", "Cursed", "Grants Proficiency", "Has Images", "Has Info", "Item Group", "Magic", "Mundane", "Sentient", "SRD"], isSrdFilter: true});
		this._baseSourceFilter = new SourceFilter({header: "Base Source", selFn: null});
	}

	static mutateForFilters (item) {
		super.mutateForFilters(item);

		item._fTier = [item.tier ? item.tier : "none"];

		if (item.curse) item._fMisc.push("Cursed");
		const isMundane = item.rarity === "none" || item.rarity === "unknown" || item._category === "basic";
		item._fMisc.push(isMundane ? "Mundane" : "Magic");
		item._fIsMundane = isMundane;
		if (item.ability) item._fMisc.push("Ability Score Adjustment");
		if (item.charges) item._fMisc.push("Charges");
		if (item.sentient) item._fMisc.push("Sentient");
		if (item.grantsProficiency) item._fMisc.push("Grants Proficiency");

		item._fBonus = [];
		if (item.bonusAc) item._fBonus.push("Armor Class");
		if (item.bonusWeapon) item._fBonus.push("Weapon Attack and Damage Rolls");
		if (item.bonusWeaponAttack) item._fBonus.push("Weapon Attack Rolls");
		if (item.bonusWeaponDamage) item._fBonus.push("Weapon Damage Rolls");
		if (item.bonusSpellAttack) item._fBonus.push("Spell Attacks");
		if (item.bonusSpellSaveDc) item._fBonus.push("Spell Save DC");
		if (item.bonusSavingThrow) item._fBonus.push("Saving Throws");
		if (item.bonusProficiencyBonus) item._fBonus.push("Proficiency Bonus");
	}

	addToFilters (item, isExcluded) {
		if (isExcluded) return;

		super.addToFilters(item, isExcluded);

		this._sourceFilter.addItem(item.source);
		this._tierFilter.addItem(item._fTier)
		this._attachedSpellsFilter.addItem(item.attachedSpells);
		this._lootTableFilter.addItem(item.lootTables);
		this._baseSourceFilter.addItem(item._baseSource);
	}

	async _pPopulateBoxOptions (opts) {
		await super._pPopulateBoxOptions(opts);

		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
			this._tierFilter,
			this._rarityFilter,
			this._propertyFilter,
			this._attunementFilter,
			this._categoryFilter,
			this._costFilter,
			this._weightFilter,
			this._focusFilter,
			this._damageTypeFilter,
			this._bonusFilter,
			this._miscFilter,
			this._lootTableFilter,
			this._baseSourceFilter,
			this._poisonTypeFilter,
			this._attachedSpellsFilter,
		];
	}

	toDisplay (values, it) {
		return this._filterBox.toDisplay(
			values,
			it.source,
			it._typeListText,
			it._fTier,
			it.rarity,
			it._fProperties,
			it._attunementCategory,
			it._category,
			it._fValue,
			it.weight,
			it._fFocus,
			it.dmgType,
			it._fBonus,
			it._fMisc,
			it.lootTables,
			it._baseSource,
			it.poisonTypes,
			it.attachedSpells,
		);
	}
}
PageFilterItems._DEFAULT_HIDDEN_TYPES = new Set(["Treasure", "Futuristic", "Modern", "Renaissance"]);

class ModalFilterItems extends ModalFilter {
	/**
	 * @param opts
	 * @param opts.namespace
	 * @param [opts.isRadio]
	 * @param [opts.allData]
	 */
	constructor (opts) {
		opts = opts || {};
		super({
			...opts,
			modalTitle: `Item${opts.isRadio ? "" : "s"}`,
			pageFilter: new PageFilterItems(),
		})
	}

	_$getColumnHeaders () {
		const btnMeta = [
			{sort: "name", text: "Name", width: "4"},
			{sort: "type", text: "Type", width: "6"},
			{sort: "source", text: "Source", width: "1"},
		];
		return ModalFilter._$getFilterColumnHeaders(btnMeta);
	}

	async _pInit () {
		await Renderer.item.populatePropertyAndTypeReference();
	}

	async _pLoadAllData () {
		const brew = await BrewUtil.pAddBrewData();
		const fromData = await Renderer.item.pBuildList({isAddGroups: true, isBlacklistVariants: true});
		const fromBrew = await Renderer.item.pGetItemsFromHomebrew(brew);
		return [...fromData, ...fromBrew];
	}

	_getListItem (pageFilter, item, itI) {
		if (item.noDisplay) return null;

		Renderer.item.enhanceItem(item);
		pageFilter.mutateAndAddToFilters(item);

		const eleRow = document.createElement("div");
		eleRow.className = "px-0 w-100 flex-col no-shrink";

		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS](item);
		const source = Parser.sourceJsonToAbv(item.source);
		const type = item._typeListText.join(", ");

		eleRow.innerHTML = `<div class="w-100 flex-vh-center lst--border no-select lst__wrp-cells">
			<div class="col-0-5 pl-0 flex-vh-center">${this._isRadio ? `<input type="radio" name="radio" class="no-events">` : `<input type="checkbox" class="no-events">`}</div>

			<div class="col-0-5 px-1 flex-vh-center">
				<div class="ui-list__btn-inline px-2" title="Toggle Preview">[+]</div>
			</div>

			<div class="col-5 ${this._getNameStyle()}">${item.name}</div>
			<div class="col-5">${type.uppercaseFirst()}</div>
			<div class="col-1 text-center ${Parser.sourceJsonToColor(item.source)} pr-0" title="${Parser.sourceJsonToFull(item.source)}" ${BrewUtil.sourceJsonToStyle(item.source)}>${source}</div>
		</div>`;

		const listItem = new ListItem(
			itI,
			eleRow,
			item.name,
			{
				hash,
				source,
				sourceJson: item.source,
				type,
			},
			{
				cbSel: eleRow.firstElementChild.firstElementChild.firstElementChild,
			},
		);

		const btnShowHidePreview = eleRow.firstElementChild.children[1].firstElementChild;
		ListUiUtil.bindPreviewButton(UrlUtil.PG_ITEMS, this._allData, listItem, btnShowHidePreview);

		return listItem;
	}
}
