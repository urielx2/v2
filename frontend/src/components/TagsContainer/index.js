import { Chip, Paper, TextField } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import React, { useEffect, useRef, useState } from "react";
import { isArray, isString } from "lodash";
import toastError from "../../errors/toastError";
import api from "../../services/api";

export function TagsContainer({ ticket, setTagAdded, tagAdded, selecteds,  setSelecteds, tags, setTags}) {
    const isMounted = useRef(true);
    const [pageNumber, setPageNumber] = useState(1);
	const [searchParam, setSearchParam] = useState("");

    


    useEffect(() => {
        return () => {
            isMounted.current = false
        }
    }, [])

    useEffect(() => {
        if (isMounted.current) {
            loadTags().then(() => {
                if (Array.isArray(ticket.tags)) {
                    setSelecteds(ticket.tags);
                } else {
                    setSelecteds([]);
                }
            });
        }
    }, [ticket]);


    
    useEffect(() => {
        fetchTags()
			.then(() => {
				verificarTagPendente();
				
			})
			.catch(err => {
				toastError(err);
			});

    }, [])

    useEffect(() => {
        setTagAdded(selecteds.filter(a => a.name == "Pendente").length? true : false)

    }, [selecteds])


    const fetchTags = async () => {
		try {
			const { data } = await api.get("/tags", {
				params: { searchParam, pageNumber },
			});
			setTags(data.tags);


		} catch (err) {
			toastError(err);
		}
	};

    const verificarTagPendente = async () => {
		if (tags.filter((tag) => tag.name === "Pendente").length === 0) {
			createTag({
				name: "Pendente",
				color: "#FF0000"
			})
		}
	};
    
    

    const createTag = async (data) => {
        try {
            const { data: responseData } = await api.post(`/tags`, data);
            return responseData;
        } catch (err) {
            toastError(err);
        }
    }

    const loadTags = async () => {
        try {
            const { data } = await api.get(`/tags/list`);
            setTags(data);
        } catch (err) {
            toastError(err);
        }
    }

    const syncTags = async (data) => {
        try {
            const { data: responseData } = await api.post(`/tags/sync`, data);
            return responseData;
        } catch (err) {
            toastError(err);
        }
    }

    const onChange = async (value, reason) => {
        let optionsChanged = []
        if (reason === 'create-option') {
            if (isArray(value)) {
                for (let item of value) {
                    if (isString(item)) {
                        const newTag = await createTag({ name: item })
                        optionsChanged.push(newTag);
                    } else {
                        optionsChanged.push(item);
                    }
                }
            }
            await loadTags();
        } else {
            optionsChanged = value;
        }
        setSelecteds(optionsChanged);
        await syncTags({ ticketId: ticket.id, tags: optionsChanged });
    }


   



    return (
        <Paper style={{ padding: 12 }}>
            <Autocomplete
                multiple
                size="small"
                options={tags}
                value={selecteds}
                freeSolo
                onChange={(e, v, r) => onChange(v, r)}
                getOptionLabel={(option) => option.name}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                        <Chip
                            variant="outlined"
                            style={{ backgroundColor: option.color || '#eee', textShadow: '1px 1px 1px #000', color: 'white' }}
                            label={option.name}
                            {...getTagProps({ index })}
                            size="small"
                        />
                    ))
                }
                renderInput={(params) => (
                    <TextField {...params} variant="outlined" placeholder="Tags" />
                )}
                PaperComponent={({ children }) => (
                    <Paper style={{ width: 400, marginLeft: 12 }}>
                        {children}
                    </Paper>
                )}
            />
        </Paper>
    )
}