import { useState } from "react";
import { IconMapPin } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";

import type { LocationId } from "@cataster/backend/types";
import refs from "@cataster/backend/confect/_generated/refs";
import {
    Combobox,
    ComboboxContent,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@cataster/ui/components/base/combobox";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@cataster/ui/components/base/empty";
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
} from "@cataster/ui/components/base/item";
import { Spinner } from "@cataster/ui/components/base/spinner";

import { confectQuery } from "~/lib/confect";
import { PARAM_PLACEHOLDER } from "~/router";

const locationsQuery = confectQuery(refs.public.locations.list, {});

export function LocationPicker() {
    const navigate = useNavigate();
    const location = useLocation();
    const { data: locations, isPending } = useQuery(locationsQuery);
    type Location = NonNullable<typeof locations>[number];
    return (
        <main className="container py-8">
            <Empty className="p-4">
                <EmptyMedia variant="icon">
                    <IconMapPin />
                </EmptyMedia>
                <EmptyHeader>
                    <EmptyTitle>Standort auswählen</EmptyTitle>
                    <EmptyDescription>
                        Wähle einen Standort aus, um seine Bäume zu verwalten.
                    </EmptyDescription>
                </EmptyHeader>
                <div className="mx-auto w-full max-w-sm space-y-2 text-left">
                    <Combobox<Location>
                        open
                        items={locations}
                        onValueChange={(next) => {
                            if (!next) return;
                            const id = next._id;
                            void navigate({
                                to: location.pathname.replace(
                                    PARAM_PLACEHOLDER,
                                    "$id",
                                ),
                                params: { id },
                            });
                        }}
                        autoHighlight
                        itemToStringLabel={({ name }) => name}
                        filter={(value, search) => {
                            return value.name
                                .toLowerCase()
                                .includes(search.toLowerCase());
                        }}
                    >
                        <ComboboxInput
                            id="location-picker"
                            placeholder="Standort suchen"
                            autoFocus
                        />
                        <ComboboxContent>
                            {isPending && (
                                <Item>
                                    <ItemMedia variant="icon">
                                        <Spinner />
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle>Lade Standorte...</ItemTitle>
                                    </ItemContent>
                                </Item>
                            )}
                            <ComboboxList>
                                {(location) => (
                                    <>
                                        <ComboboxItem
                                            key={location._id}
                                            value={location}
                                            render={
                                                <Item size="xs">
                                                    <ItemContent>
                                                        <ItemTitle className="whitespace-nowrap">
                                                            {location.name}
                                                        </ItemTitle>
                                                        <ItemDescription>
                                                            OSM{" "}
                                                            {location.osmType} #
                                                            {location.osmId}
                                                        </ItemDescription>
                                                    </ItemContent>
                                                </Item>
                                            }
                                        />
                                    </>
                                )}
                                {/* 
                                {locations?.map((location) => (
                                    
                                ))} */}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                </div>
            </Empty>
        </main>
    );
}
