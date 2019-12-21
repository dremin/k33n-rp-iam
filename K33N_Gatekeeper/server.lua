local welcomeMsg = "Welcome to K33N! Checking whitelist status..."
local steamMsg = "Please open Steam and try again."
local noEntryMsg = "You are not able to join this server. Register and apply for our whitelist today: k33ngaming.com/apply"

function iamRequest(method, endpoint, jsonData)
	local data = nil
	PerformHttpRequest("https://k33ngaming.com/fivem-iam/api/" .. endpoint, function(errorCode, resultData, resultHeaders)
		data = {
			data = resultData,
			code = errorCode,
			headers = resultHeaders
			}
	end, method, #jsonData > 0 and json.encode(jsonData) or "", { ["Content-Type"] = "application/json" })
	
	while data == nil do
		Citizen.Wait(0)
	end
	
	return data
end

AddEventHandler("playerConnecting", function(name, setKickReason, deferrals)
	local identifiers, steamIdentifier = GetPlayerIdentifiers(source)
	deferrals.defer()
	
	deferrals.update(welcomeMsg)
	
	-- get steam identifier
	for _, v in pairs(identifiers) do
	    if string.find(v, "steam") then
	        steamIdentifier = v
	        break
	    end
	end
	
	-- check steam present first
	if not steamIdentifier then
	    deferrals.done(steamMsg)
	else
	    -- call iam with steam identifier
	    print("Checking whitelist for Steam identifier: " .. steamIdentifier)
	    local userStatus = iamRequest("GET", "check-access/" .. steamIdentifier, {})
		if userStatus.code == 200 then
			local env = GetConvar('krp_env', 'dev')

			if env == 'test' then
				-- require priority to join test server
				local data = json.decode(userStatus.data)
				if data.priority ~= nil and data.priority > 0 then
					-- all good!
				else
					print("Denied access to " .. steamIdentifier .. " got priority " .. data.priority)
					deferrals.done(noEntryMsg .. "\nPriority access is required to join this server.\nYour Steam hex is: " .. string.gsub(steamIdentifier, "steam:", ""))
					return
				end
			end
		    -- we are whitelisted!
			print("Welcome " .. steamIdentifier)
			
			-- continue to next resource to load.
		    deferrals.done()
		else
			print("Denied access to " .. steamIdentifier .. " got status code " .. userStatus.code)
			deferrals.done(noEntryMsg .. "\nYour Steam hex is: " .. string.gsub(steamIdentifier, "steam:", ""))
		end
	end
end)