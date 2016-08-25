package api

import (
	"bufio"
	"os"
	"regexp"

	"github.com/grafana/grafana/pkg/middleware"
	"github.com/grafana/grafana/pkg/setting"
)

func ExploreMetrics(c *middleware.Context) Response {
	var result []string
	filePath := setting.GraphiteMetrics
	f, err := os.Open(filePath)
	if err != nil {
		return ApiError(500, "Error opening file.", err)
	}

	query := c.Query("query")
	limit := c.QueryInt("limit")

	// compile optimized regexp struct
	r, _ := regexp.Compile(query)

	// set a hard limit of 1000 if no limit provided
	if limit == 0 {
		limit = 1000
	}

	i := 0
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		if len(query) <= 0 {
			break
		}
		if i >= limit {
			break
		}
		scanner_text := scanner.Text()
		r_results := r.FindAllString(scanner_text, -1)
		if len(r_results) > 0 {
			result = append(result, scanner_text)
			i++
		}
	}

	if err := scanner.Err(); err != nil {
		return ApiError(500, "Search failed.", err)
	}

	return Json(200, result)
}
